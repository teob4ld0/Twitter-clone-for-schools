using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Hubs;
using MyNetApp.Models;
using MyNetApp.Services;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/status")]
public class StatusController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _notificationHubContext;
    private readonly NotificationService _notificationService;

    public StatusController(AppDbContext context, IHubContext<NotificationHub> notificationHubContext, NotificationService notificationService)
    {
        _context = context;
        _notificationHubContext = notificationHubContext;
        _notificationService = notificationService;
    }

    // Create status (root or reply)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStatusDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (string.IsNullOrWhiteSpace(dto.Content))
            return BadRequest("Content is required");

        if (!string.IsNullOrWhiteSpace(dto.MediaUrl))
        {
            if (!Uri.TryCreate(dto.MediaUrl, UriKind.Absolute, out var uri)
                || !(string.Equals(uri.Scheme, "http", StringComparison.OrdinalIgnoreCase)
                     || string.Equals(uri.Scheme, "https", StringComparison.OrdinalIgnoreCase))
                || !string.Equals(uri.Host, "media.twittetec.com", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Invalid mediaUrl");
            }
        }

        Status? parent = null;
        if (dto.ParentStatusId.HasValue)
        {
            parent = await _context.Statuses
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == dto.ParentStatusId.Value);
            if (parent == null)
                return NotFound("Parent status not found");
        }

        Status? quoted = null;
        if (dto.QuotedStatusId.HasValue)
        {
            quoted = await _context.Statuses
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == dto.QuotedStatusId.Value);
            if (quoted == null)
                return NotFound("Quoted status not found");
        }

        var status = new Status
        {
            Content = dto.Content.Trim(),
            UserId = currentUserId,
            ParentStatusId = dto.ParentStatusId,
            QuotedStatusId = dto.QuotedStatusId,
            MediaUrl = string.IsNullOrWhiteSpace(dto.MediaUrl) ? null : dto.MediaUrl.Trim()
        };

        _context.Statuses.Add(status);
        await _context.SaveChangesAsync();

        // Procesar menciones (@username) y enviar notificaciones
        await ProcessMentionsAsync(status.Content, currentUserId, status.Id);

        // Notificación si es reply y no es a uno mismo
        if (parent != null && parent.UserId != currentUserId)
        {
            var type = parent.ParentStatusId == null ? NotificationType.ReplyOnStatus : NotificationType.ReplyOnReply;
            await _notificationService.SendNotificationAsync(
                targetUserId: parent.UserId,
                actorId: currentUserId,
                type: type,
                statusId: status.Id
            );
        }

        // Notificación si es quote y no es a uno mismo
        if (quoted != null && quoted.UserId != currentUserId)
        {
            await _notificationService.SendNotificationAsync(
                targetUserId: quoted.UserId,
                actorId: currentUserId,
                type: NotificationType.Quote,
                statusId: status.Id
            );
        }

        // Reload with user data for frontend
        var created = await _context.Statuses
            .Include(s => s.User)
            .Include(s => s.QuotedStatus)
                .ThenInclude(q => q!.User)
            .FirstAsync(s => s.Id == status.Id);

        return Ok(new
        {
            created.Id,
            created.Content,
            created.MediaUrl,
            created.CreatedAt,
            Author = created.User.Username,
            AuthorId = created.UserId,
            AuthorProfilePictureUrl = created.User.ProfilePictureUrl,
            QuotedStatusId = created.QuotedStatusId,
            QuotedStatus = created.QuotedStatusId != null ? new
            {
                created.QuotedStatus!.Id,
                created.QuotedStatus.Content,
                created.QuotedStatus.MediaUrl,
                created.QuotedStatus.CreatedAt,
                Author = created.QuotedStatus.User.Username,
                AuthorId = created.QuotedStatus.UserId,
                AuthorProfilePictureUrl = created.QuotedStatus.User.ProfilePictureUrl
            } : null,
            Likes = 0,
            RepostsCount = 0,
            RepliesCount = 0,
            IsLikedByCurrentUser = false,
            IsRepostedByCurrentUser = false
        });
    }

    // Listing root statuses
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        var statuses = await _context.Statuses
            .Where(s => s.ParentStatusId == null)
            .Include(s => s.User)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.Content,
                s.MediaUrl,
                s.CreatedAt,
                Author = s.User.Username,
                AuthorId = s.UserId,
                AuthorProfilePictureUrl = s.User.ProfilePictureUrl,
                s.QuotedStatusId,
                QuotedStatus = s.QuotedStatus != null ? new
                {
                    s.QuotedStatus.Id,
                    s.QuotedStatus.Content,
                    s.QuotedStatus.MediaUrl,
                    s.QuotedStatus.CreatedAt,
                    Author = s.QuotedStatus.User.Username,
                    AuthorId = s.QuotedStatus.UserId,
                    AuthorProfilePictureUrl = s.QuotedStatus.User.ProfilePictureUrl
                } : null,
                Likes = s.Likes.Count,
                RepostsCount = s.Reposts.Count + s.Quotes.Count(q => q.ParentStatusId == null),
                RepliesCount = s.Replies.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && s.Likes.Any(l => l.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && s.Reposts.Any(r => r.UserId == currentUserId.Value)
            })
            .ToListAsync();

        return Ok(statuses);
    }

    // Get a single root status with its replies
    [HttpGet("{statusId}")]
    public async Task<IActionResult> GetById(int statusId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        var status = await _context.Statuses
            .Where(s => s.Id == statusId)
            .Select(s => new
            {
                s.Id,
                s.Content,
                s.MediaUrl,
                s.CreatedAt,
                Author = s.User.Username,
                AuthorId = s.UserId,
                AuthorProfilePictureUrl = s.User.ProfilePictureUrl,
                s.QuotedStatusId,
                QuotedStatus = s.QuotedStatus != null ? new
                {
                    s.QuotedStatus.Id,
                    s.QuotedStatus.Content,
                    s.QuotedStatus.MediaUrl,
                    s.QuotedStatus.CreatedAt,
                    Author = s.QuotedStatus.User.Username,
                    AuthorId = s.QuotedStatus.UserId,
                    AuthorProfilePictureUrl = s.QuotedStatus.User.ProfilePictureUrl
                } : null,
                Likes = s.Likes.Count,
                RepostsCount = s.Reposts.Count + s.Quotes.Count(q => q.ParentStatusId == null),
                RepliesCount = s.Replies.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && s.Likes.Any(l => l.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && s.Reposts.Any(r => r.UserId == currentUserId.Value),
                Replies = s.Replies
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => new
                    {
                        c.Id,
                        c.Content,
                        c.MediaUrl,
                        c.CreatedAt,
                        Author = c.User.Username,
                        AuthorId = c.UserId,
                        AuthorProfilePictureUrl = c.User.ProfilePictureUrl,
                        c.QuotedStatusId,
                        QuotedStatus = c.QuotedStatus != null ? new
                        {
                            c.QuotedStatus.Id,
                            c.QuotedStatus.Content,
                            c.QuotedStatus.MediaUrl,
                            c.QuotedStatus.CreatedAt,
                            Author = c.QuotedStatus.User.Username,
                            AuthorId = c.QuotedStatus.UserId,
                            AuthorProfilePictureUrl = c.QuotedStatus.User.ProfilePictureUrl
                        } : null,
                        Likes = c.Likes.Count,
                        RepostsCount = c.Reposts.Count + c.Quotes.Count(q => q.ParentStatusId == null),
                        RepliesCount = c.Replies.Count,
                        IsLikedByCurrentUser = currentUserId.HasValue && c.Likes.Any(l => l.UserId == currentUserId.Value),
                        IsRepostedByCurrentUser = currentUserId.HasValue && c.Reposts.Any(r => r.UserId == currentUserId.Value)
                    })
            })
            .FirstOrDefaultAsync();

        if (status == null)
            return NotFound();

        return Ok(status);
    }

    // Get direct replies for a status
    [HttpGet("{statusId}/replies")]
    public async Task<IActionResult> GetReplies(int statusId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? currentUserId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        var replies = await _context.Statuses
            .Where(s => s.ParentStatusId == statusId)
            .OrderBy(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.Content,
                s.MediaUrl,
                s.CreatedAt,
                Author = s.User.Username,
                AuthorId = s.UserId,
                AuthorProfilePictureUrl = s.User.ProfilePictureUrl,
                s.QuotedStatusId,
                QuotedStatus = s.QuotedStatus != null ? new
                {
                    s.QuotedStatus.Id,
                    s.QuotedStatus.Content,
                    s.QuotedStatus.MediaUrl,
                    s.QuotedStatus.CreatedAt,
                    Author = s.QuotedStatus.User.Username,
                    AuthorId = s.QuotedStatus.UserId,
                    AuthorProfilePictureUrl = s.QuotedStatus.User.ProfilePictureUrl
                } : null,
                Likes = s.Likes.Count,
                RepostsCount = s.Reposts.Count + s.Quotes.Count(q => q.ParentStatusId == null),
                RepliesCount = s.Replies.Count,
                IsLikedByCurrentUser = currentUserId.HasValue && s.Likes.Any(l => l.UserId == currentUserId.Value),
                IsRepostedByCurrentUser = currentUserId.HasValue && s.Reposts.Any(r => r.UserId == currentUserId.Value)
            })
            .ToListAsync();

        return Ok(replies);
    }

    // Toggle like on a status (root or reply)
    [Authorize]
    [HttpPost("{statusId}/like")]
    public async Task<IActionResult> ToggleLike(int statusId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var status = await _context.Statuses
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == statusId);
        if (status == null)
            return NotFound("Status not found");

        var existing = await _context.StatusLikes
            .FirstOrDefaultAsync(l => l.UserId == currentUserId && l.StatusId == statusId);

        var isLiking = existing == null;
        if (existing == null)
        {
            _context.StatusLikes.Add(new StatusLike { UserId = currentUserId, StatusId = statusId });

            // Create notification if not liking own status
            if (status.UserId != currentUserId)
            {
                await _notificationService.SendNotificationAsync(
                    targetUserId: status.UserId,
                    actorId: currentUserId,
                    type: NotificationType.Like,
                    statusId: statusId
                );
            }
        }
        else
        {
            _context.StatusLikes.Remove(existing);
        }

        await _context.SaveChangesAsync();

        return Ok(new { liked = isLiking });
    }

    [Authorize]
    [HttpPost("{statusId}/repost")]
    public async Task<IActionResult> ToggleRepost(int statusId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var status = await _context.Statuses
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == statusId);
        if (status == null)
            return NotFound("Status not found");

        var existing = await _context.Reposts
            .FirstOrDefaultAsync(r => r.UserId == currentUserId && r.StatusId == statusId);

        var isReposting = existing == null;
        if (existing == null)
        {
            _context.Reposts.Add(new Repost { UserId = currentUserId, StatusId = statusId });

            // Create notification if not reposting own status
            if (status.UserId != currentUserId)
            {
                await _notificationService.SendNotificationAsync(
                    targetUserId: status.UserId,
                    actorId: currentUserId,
                    type: NotificationType.Repost,
                    statusId: statusId
                );
            }
        }
        else
        {
            _context.Reposts.Remove(existing);
        }

        await _context.SaveChangesAsync();
        var repostsCount = await _context.Reposts.CountAsync(r => r.StatusId == statusId);

        return Ok(new { reposted = isReposting, repostsCount });
    }

    // Delete status (only owner)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var status = await _context.Statuses.FindAsync(id);
        if (status == null)
            return NotFound();

        if (status.UserId != currentUserId)
            return Forbid();

        _context.Statuses.Remove(status);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Helpers
    private async Task<(int threadId, int? parentStatusId)> ResolveThreadIds(int statusId)
    {
        // Resolve root thread by walking ParentStatusId. Works for infinite chains.
        int threadId = statusId;
        int? parentStatusId = null;
        int? current = statusId;

        while (current.HasValue)
        {
            var row = await _context.Statuses
                .Where(s => s.Id == current.Value)
                .Select(s => new { s.Id, s.ParentStatusId })
                .FirstOrDefaultAsync();
            if (row == null) break;
            parentStatusId = row.ParentStatusId;
            threadId = row.ParentStatusId ?? row.Id;
            current = row.ParentStatusId;
        }

        return (threadId, parentStatusId);
    }

    private async Task ProcessMentionsAsync(string content, int actorId, int statusId)
    {
        // Regex para detectar @username#id (ejemplo: @pepehongo#234)
        var mentionPattern = @"@(\w+)#(\d+)";
        var matches = System.Text.RegularExpressions.Regex.Matches(content, mentionPattern);
        
        var mentionedUserIds = matches
            .Select(m => int.TryParse(m.Groups[2].Value, out var id) ? id : (int?)null)
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        if (!mentionedUserIds.Any()) return;

        // Buscar usuarios mencionados que existen por ID
        var mentionedUsers = await _context.Users
            .Where(u => mentionedUserIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Username })
            .ToListAsync();

        // Crear notificaciones para cada usuario mencionado (excepto el autor)
        foreach (var user in mentionedUsers)
        {
            if (user.Id == actorId) continue; // No notificar al autor

            await _notificationService.SendNotificationAsync(
                targetUserId: user.Id,
                actorId: actorId,
                type: NotificationType.Mention,
                statusId: statusId
            );
        }
    }
}