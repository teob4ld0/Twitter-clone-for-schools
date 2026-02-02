using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Attributes;
using MyNetApp.Data;
using MyNetApp.Hubs;
using MyNetApp.Models;
using MyNetApp.Services;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/users/followers")]

public class FollowerController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly NotificationService _notificationService;

    public FollowerController(AppDbContext context, IHubContext<NotificationHub> hubContext, NotificationService notificationService)
    {
        _context = context;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    // Listing followers of a user (public)
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetFollowers(int userId)
    {
        var followers = await _context.Followers
            .Where(f => f.FollowingId == userId)
            .Select(f => new
            {
                f.FollowerUser.Id,
                f.FollowerUser.Username,
                f.FollowerUser.Email,
                f.CreatedAt
            })
            .ToListAsync();
        return Ok(followers);
    }

    // Check if current user is following a specific user
    [Authorize]
    [HttpGet("{userId}/status")]
    public async Task<IActionResult> GetFollowStatus(int userId)
    {
        var currentUserId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        ); 

        // Check if current user follows the target user
        var isFollowing = await _context.Followers
            .AnyAsync(f => f.FollowerId == currentUserId && f.FollowingId == userId);

        // Check if target user follows current user
        var followsBack = await _context.Followers
            .AnyAsync(f => f.FollowerId == userId && f.FollowingId == currentUserId);

        return Ok(new {
            isFollowing,
            followsBack,
            isMutual = isFollowing && followsBack
        });
    }

    // Get mutual followers: people you follow who also follow this user
    [Authorize]
    [HttpGet("{userId}/mutual")]
    public async Task<IActionResult> GetMutualFollowers(int userId)
    {
        var currentUserId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        // Get users that:
        // 1. Current user follows (currentUserId follows them)
        // 2. AND they follow the target user (they follow userId)
        var mutualFollowers = await _context.Followers
            .Where(f => f.FollowingId == userId) // People who follow the target user
            .Where(f => _context.Followers.Any(f2 =>
                f2.FollowerId == currentUserId && // Current user follows them
                f2.FollowingId == f.FollowerId))   // Same person
            .Select(f => new
            {
                f.FollowerUser.Id,
                f.FollowerUser.Username
            })
            .Take(3) // Limit to 3 for the "Followed by X, Y, and Z" message
            .ToListAsync();

        return Ok(new {
            mutualFollowers,
            count = mutualFollowers.Count
        });
    }

    [Authorize]
    [HttpPost("{userId}")]
    public async Task<IActionResult> ToggleFollow(int userId)
    {
        // Get the authenticated user's ID (the follower)
        var followerId = int.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!
        );

        // Prevent users from following themselves
        if (followerId == userId)
        {
            return BadRequest(new { message = "You cannot follow yourself" });
        }

        // Check if the user to follow exists
        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
        {
            return NotFound(new { message = "User not found" });
        }

        // Check if already following
        var existing = await _context.Followers
            .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FollowingId == userId);

        if (existing == null)
        {
            // Not following yet, create the follow relationship
            _context.Followers.Add(new Follower
            {
                FollowerId = followerId,
                FollowingId = userId
            });

            // Save follower relationship
            await _context.SaveChangesAsync();

            // Send notification using NotificationService (includes push notification)
            await _notificationService.SendNotificationAsync(
                targetUserId: userId,
                actorId: followerId,
                type: NotificationType.Follow
            );

            return Ok(new { message = "Now following user", isFollowing = true });
        }
        else
        {
            // Already following, remove the follow relationship (unfollow)
            _context.Followers.Remove(existing);

            // Remove the follow notification if it exists
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n =>
                    n.ActorId == followerId &&
                    n.TargetUserId == userId &&
                    n.Type == NotificationType.Follow);

            if (notification != null)
            {
                _context.Notifications.Remove(notification);
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Unfollowed user", isFollowing = false });
        }
    }
}