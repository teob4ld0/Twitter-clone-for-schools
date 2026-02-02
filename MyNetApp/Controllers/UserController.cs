using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Attributes;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using MyNetApp.Services;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
	private readonly IMediaStorage _mediaStorage;

    public UsersController(AppDbContext context, IMediaStorage mediaStorage)
    {
        _context = context;
		_mediaStorage = mediaStorage;
    }

    // Listar usuarios, solo lo deberían de poder hacer las personas con mail que no sean de alumno (@alumno.etec.um.edu.ar)
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Verificar que el usuario NO sea alumno
        var emailClaim = User.FindFirst(ClaimTypes.Email);
        if (emailClaim == null || emailClaim.Value.EndsWith("@alumno.etec.um.edu.ar", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }
        
        var users = await _context.Users
            .Include(u => u.Followers)
                .ThenInclude(f => f.FollowerUser)
            .Include(u => u.Following)
                .ThenInclude(f => f.FollowingUser)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.Banned,
                u.CreatedAt,
                u.EmailVerified,
                StatusesCount = u.Statuses.Count(s => s.ParentStatusId == null),
                FollowersCount = u.Followers.Count,
                FollowingCount = u.Following.Count,
                Followers = u.Followers.Select(f => new
                {
                    f.FollowerUser.Id,
                    f.FollowerUser.Username,
                    f.FollowerUser.Email
                }).ToList(),
                Following = u.Following.Select(f => new
                {
                    f.FollowingUser.Id,
                    f.FollowingUser.Username,
                    f.FollowingUser.Email
                }).ToList()
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.CreatedAt,
				u.ProfilePictureUrl,
                StatusesCount = u.Statuses.Count(s => s.ParentStatusId == null),
                FollowersCount = u.Followers.Count,
                FollowingCount = u.Following.Count
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        return Ok(user);
    }

    // Update own profile picture (uploads to bucket and stores the public URL)
    [Authorize]
    [HttpPost("me/profile-picture")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateMyProfilePicture([FromForm] IFormFile file, CancellationToken ct = default)
    {
        if (file is null)
            return BadRequest(new { message = "file is required" });
        if (file.Length <= 0)
            return BadRequest(new { message = "file is empty" });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var currentUserId))
            return Unauthorized(new { message = "Invalid token" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId, ct);
        if (user is null)
            return NotFound(new { message = "User not found" });

        var uploadResult = await _mediaStorage.UploadAsync(file, prefix: "profile-pictures", ct: ct);
        user.ProfilePictureUrl = uploadResult.PublicUrl;
        await _context.SaveChangesAsync(ct);

        return Ok(new ProfilePictureDto
        {
            ProfilePictureUrl = user.ProfilePictureUrl
        });
    }
    [HttpGet("{id}/statuses")]
    public async Task<IActionResult> GetStatusesById(int id)
    {
        // Get current user ID if authenticated (null if not)
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        // Own root statuses
        var own = _context.Statuses
            .Where(s => s.UserId == id && s.ParentStatusId == null)
            .Select(s => new
            {
                ActivityAt = s.CreatedAt,
                IsRepost = false,
                OriginalCreatedAt = s.CreatedAt,
                s.Id,
                s.Content,
                s.MediaUrl,
                CreatedAt = s.CreatedAt,
                Author = s.User.Username,
                AuthorId = s.UserId,
                AuthorProfilePictureUrl = s.User.ProfilePictureUrl,
                s.QuotedStatusId,
                QuotedStatusContent = s.QuotedStatus != null ? s.QuotedStatus.Content : null,
                QuotedStatusMediaUrl = s.QuotedStatus != null ? s.QuotedStatus.MediaUrl : null,
                QuotedStatusCreatedAt = s.QuotedStatus != null ? (DateTime?)s.QuotedStatus.CreatedAt : null,
                QuotedStatusAuthor = s.QuotedStatus != null ? s.QuotedStatus.User.Username : null,
                QuotedStatusAuthorId = s.QuotedStatus != null ? (int?)s.QuotedStatus.UserId : null,
                QuotedStatusAuthorProfilePictureUrl = s.QuotedStatus != null ? s.QuotedStatus.User.ProfilePictureUrl : null,
                Likes = s.Likes.Count,
                RepostsCount = s.Reposts.Count,
                RepliesCount = s.Replies.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && s.Likes.Any(l => l.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && s.Reposts.Any(r => r.UserId == currentUserId.Value)
            });

        // Reposts made by this user (root statuses only, and not their own)
        var reposts = _context.Reposts
            .Where(r => r.UserId == id && r.Status.ParentStatusId == null && r.Status.UserId != id)
            .Select(r => new
            {
                ActivityAt = r.CreatedAt,
                IsRepost = true,
                OriginalCreatedAt = r.Status.CreatedAt,
                r.Status.Id,
                r.Status.Content,
                r.Status.MediaUrl,
                CreatedAt = r.CreatedAt, // show repost time in the feed
                Author = r.Status.User.Username,
                AuthorId = r.Status.UserId,
                AuthorProfilePictureUrl = r.Status.User.ProfilePictureUrl,
                QuotedStatusId = r.Status.QuotedStatusId,
                QuotedStatusContent = r.Status.QuotedStatus != null ? r.Status.QuotedStatus.Content : null,
                QuotedStatusMediaUrl = r.Status.QuotedStatus != null ? r.Status.QuotedStatus.MediaUrl : null,
                QuotedStatusCreatedAt = r.Status.QuotedStatus != null ? (DateTime?)r.Status.QuotedStatus.CreatedAt : null,
                QuotedStatusAuthor = r.Status.QuotedStatus != null ? r.Status.QuotedStatus.User.Username : null,
                QuotedStatusAuthorId = r.Status.QuotedStatus != null ? (int?)r.Status.QuotedStatus.UserId : null,
                QuotedStatusAuthorProfilePictureUrl = r.Status.QuotedStatus != null ? r.Status.QuotedStatus.User.ProfilePictureUrl : null,
                Likes = r.Status.Likes.Count,
                RepostsCount = r.Status.Reposts.Count,
                RepliesCount = r.Status.Replies.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && r.Status.Likes.Any(l => l.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && r.Status.Reposts.Any(re => re.UserId == currentUserId.Value)
            });

        var statuses = await own
            .Concat(reposts)
            .OrderByDescending(x => x.ActivityAt)
            .ToListAsync();

        // EF Core can't always translate Concat/Union with nested (client) projections.
        // We project only scalars above, then shape the nested QuotedStatus object here.
        return Ok(statuses.Select(s => new
        {
            s.ActivityAt,
            s.IsRepost,
            s.OriginalCreatedAt,
            s.Id,
            s.Content,
            s.MediaUrl,
            s.CreatedAt,
            s.Author,
            s.AuthorId,
            s.AuthorProfilePictureUrl,
            s.Likes,
            s.RepostsCount,
            s.RepliesCount,
            s.IsLikedByCurrentUser,
            s.IsRepostedByCurrentUser,
            s.QuotedStatusId,
            QuotedStatus = s.QuotedStatusId != null ? new
            {
                Id = s.QuotedStatusId.Value,
                Content = s.QuotedStatusContent,
                MediaUrl = s.QuotedStatusMediaUrl,
                CreatedAt = s.QuotedStatusCreatedAt,
                Author = s.QuotedStatusAuthor,
                AuthorId = s.QuotedStatusAuthorId,
                AuthorProfilePictureUrl = s.QuotedStatusAuthorProfilePictureUrl
            } : null
        }));
    }

    [HttpGet("{id}/likes")]
    public async Task<IActionResult> GetLikesById(int id)
    {
        // Get current user ID if authenticated (null if not)
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        // Root statuses that this user has liked
        var likedStatuses = await _context.StatusLikes
            .Where(l => l.UserId == id && l.Status.ParentStatusId == null)
            .Include(l => l.Status)
                .ThenInclude(s => s.User)
            .Select(l => new
            {
                l.Status.Id,
                l.Status.Content,
                l.Status.MediaUrl,
                l.Status.CreatedAt,
                Author = l.Status.User.Username,
                AuthorId = l.Status.UserId,
                AuthorProfilePictureUrl = l.Status.User.ProfilePictureUrl,
                QuotedStatusId = l.Status.QuotedStatusId,
                QuotedStatus = l.Status.QuotedStatus != null ? new
                {
                    l.Status.QuotedStatus.Id,
                    l.Status.QuotedStatus.Content,
                    l.Status.QuotedStatus.MediaUrl,
                    l.Status.QuotedStatus.CreatedAt,
                    Author = l.Status.QuotedStatus.User.Username,
                    AuthorId = l.Status.QuotedStatus.UserId,
                    AuthorProfilePictureUrl = l.Status.QuotedStatus.User.ProfilePictureUrl
                } : null,
                Likes = l.Status.Likes.Count,
                RepostsCount = l.Status.Reposts.Count,
                RepliesCount = l.Status.Replies.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && l.Status.Likes.Any(like => like.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && l.Status.Reposts.Any(r => r.UserId == currentUserId.Value),
                LikedAt = l.CreatedAt
            })
            .OrderByDescending(p => p.LikedAt)
            .ToListAsync();

        // Reply statuses that this user has liked
        var likedReplies = await _context.StatusLikes
            .Where(l => l.UserId == id && l.Status.ParentStatusId != null)
            .Include(l => l.Status)
                .ThenInclude(s => s.User)
            .Include(l => l.Status)
                .ThenInclude(s => s.ParentStatus!)
                    .ThenInclude(p => p.User)
            .Select(l => new
            {
                l.Status.Id,
                l.Status.Content,
                l.Status.CreatedAt,
                Author = l.Status.User.Username,
                AuthorId = l.Status.UserId,
                AuthorProfilePictureUrl = l.Status.User.ProfilePictureUrl,
                ParentStatusId = l.Status.ParentStatusId,
                ParentAuthor = l.Status.ParentStatus!.User.Username,
                ParentContent = l.Status.ParentStatus!.Content,
                QuotedStatusId = l.Status.QuotedStatusId,
                QuotedStatus = l.Status.QuotedStatus != null ? new
                {
                    l.Status.QuotedStatus.Id,
                    l.Status.QuotedStatus.Content,
                    l.Status.QuotedStatus.CreatedAt,
                    Author = l.Status.QuotedStatus.User.Username,
                    AuthorId = l.Status.QuotedStatus.UserId,
                    AuthorProfilePictureUrl = l.Status.QuotedStatus.User.ProfilePictureUrl
                } : null,
                Likes = l.Status.Likes.Count,
                RepostsCount = l.Status.Reposts.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && l.Status.Likes.Any(like => like.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && l.Status.Reposts.Any(r => r.UserId == currentUserId.Value),
                LikedAt = l.CreatedAt
            })
            .OrderByDescending(c => c.LikedAt)
            .ToListAsync();

        return Ok(new
        {
            Statuses = likedStatuses,
            Replies = likedReplies
        });
    }

    [HttpGet("{id}/replies")]
    public async Task<IActionResult> GetRepliesById(int id)
    {
        // Get current user ID if authenticated (null if not)
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        var replies = await _context.Statuses
            .Where(s => s.UserId == id && s.ParentStatusId != null)
            .Include(s => s.ParentStatus!)
                .ThenInclude(p => p.User)
            .Select(s => new
            {
                s.Id,
                s.Content,
                s.CreatedAt,
                Author = s.User.Username,
                AuthorId = s.UserId,
                AuthorProfilePictureUrl = s.User.ProfilePictureUrl,
                ParentStatusId = s.ParentStatusId,
                ParentAuthor = s.ParentStatus!.User.Username,
                ParentContent = s.ParentStatus!.Content,
                s.QuotedStatusId,
                QuotedStatus = s.QuotedStatus != null ? new
                {
                    s.QuotedStatus.Id,
                    s.QuotedStatus.Content,
                    s.QuotedStatus.CreatedAt,
                    Author = s.QuotedStatus.User.Username,
                    AuthorId = s.QuotedStatus.UserId,
                    AuthorProfilePictureUrl = s.QuotedStatus.User.ProfilePictureUrl
                } : null,
                Likes = s.Likes.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && s.Likes.Any(l => l.UserId == currentUserId.Value)
            })
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return Ok(replies);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUserById(int id)
    {
        // Verificar que el usuario NO sea alumno
        var emailClaim = User.FindFirst(ClaimTypes.Email);
        if (emailClaim == null || emailClaim.Value.EndsWith("@alumno.etec.um.edu.ar", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // No permitir eliminar a otros admins
        if (!user.Email.EndsWith("@alumno.etec.um.edu.ar", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot delete admin users" });
        }

        // 1. Eliminar notificaciones relacionadas
        var notifications = await _context.Notifications
            .Where(n => n.ActorId == id || n.TargetUserId == id)
            .ToListAsync();
        _context.Notifications.RemoveRange(notifications);

        // 2. Eliminar suscripciones push
        var pushSubscriptions = await _context.PushSubscriptions
            .Where(p => p.UserId == id)
            .ToListAsync();
        _context.PushSubscriptions.RemoveRange(pushSubscriptions);

        // 3. Eliminar mensajes
        var messages = await _context.Messages
            .Where(m => m.SenderId == id)
            .ToListAsync();
        _context.Messages.RemoveRange(messages);

        // 4. Eliminar chats donde participa
        var chats = await _context.Chats
            .Where(c => c.User1Id == id || c.User2Id == id)
            .ToListAsync();
        _context.Chats.RemoveRange(chats);

        // 5. Eliminar los likes del usuario en statuses de otros
        var userLikes = await _context.StatusLikes
            .Where(l => l.UserId == id)
            .ToListAsync();
        _context.StatusLikes.RemoveRange(userLikes);

        // 6. Eliminar los reposts del usuario
        var userReposts = await _context.Reposts
            .Where(r => r.UserId == id)
            .ToListAsync();
        _context.Reposts.RemoveRange(userReposts);

        // 7. Eliminar seguidores y seguidos
        var followers = await _context.Followers
            .Where(f => f.FollowerId == id || f.FollowingId == id)
            .ToListAsync();
        _context.Followers.RemoveRange(followers);

        // 8. Obtener IDs de los statuses del usuario
        var userStatusIds = await _context.Statuses
            .Where(s => s.UserId == id)
            .Select(s => s.Id)
            .ToListAsync();

        // 9. Eliminar likes en los statuses del usuario
        var likesOnUserStatuses = await _context.StatusLikes
            .Where(l => userStatusIds.Contains(l.StatusId))
            .ToListAsync();
        _context.StatusLikes.RemoveRange(likesOnUserStatuses);

        // 10. Eliminar reposts de los statuses del usuario
        var repostsOfUserStatuses = await _context.Reposts
            .Where(r => userStatusIds.Contains(r.StatusId))
            .ToListAsync();
        _context.Reposts.RemoveRange(repostsOfUserStatuses);

        // 11. Desvincular statuses que quotean los statuses del usuario
        var statusesQuotingUser = await _context.Statuses
            .Where(s => s.QuotedStatusId.HasValue && userStatusIds.Contains(s.QuotedStatusId.Value))
            .ToListAsync();
        foreach (var status in statusesQuotingUser)
        {
            status.QuotedStatusId = null;
        }

        // 12. Eliminar replies a los statuses del usuario
        var repliesToUserStatuses = await _context.Statuses
            .Where(s => s.ParentStatusId.HasValue && userStatusIds.Contains(s.ParentStatusId.Value))
            .ToListAsync();
        _context.Statuses.RemoveRange(repliesToUserStatuses);

        // 13. Eliminar los statuses del usuario
        var userStatuses = await _context.Statuses
            .Where(s => s.UserId == id)
            .ToListAsync();
        _context.Statuses.RemoveRange(userStatuses);

        // 14. Finalmente eliminar el usuario
        _context.Users.Remove(user);
        
        await _context.SaveChangesAsync();

        return Ok(new { message = "User deleted successfully", userId = id, username = user.Username });
    }

    [Authorize]
    [HttpPut("{id}/ban")]
    public async Task<IActionResult> BanUserById(int id, [FromBody] BanUserDto banUserDto)
    {
        // Verificar que el usuario NO sea alumno
        var emailClaim = User.FindFirst(ClaimTypes.Email);
        if (emailClaim == null || emailClaim.Value.EndsWith("@alumno.etec.um.edu.ar", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        // No permitir banear a otros admins
        if (!user.Email.EndsWith("@alumno.etec.um.edu.ar", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot ban admin users" });
        }

        user.Banned = !user.Banned;
        await _context.SaveChangesAsync();

        return Ok(new { message = user.Banned ? "User banned successfully" : "User unbanned successfully", userId = user.Id, username = user.Username, banned = user.Banned });
    }

}