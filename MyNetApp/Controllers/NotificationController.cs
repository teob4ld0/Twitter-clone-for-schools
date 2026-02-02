using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationController(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/notifications - Obtener notificaciones del usuario
    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var notifications = await _context.Notifications
            .Where(n => n.TargetUserId == currentUserId)
            .Include(n => n.Actor)
            .Include(n => n.Status!)
                .ThenInclude(s => s.ParentStatus)
            .Include(n => n.Status!)
                .ThenInclude(s => s.QuotedStatus)
            .Include(n => n.Message)
            .OrderByDescending(n => n.CreatedAt)
            .Take(50) // Limitar a las últimas 50 notificaciones
            .ToListAsync();

        // Resolver threadId de forma segura (máx 50 items, ok post-proceso)
        var result = new List<object>(notifications.Count);
        foreach (var n in notifications)
        {
            int? statusId = n.StatusId;

            int? threadId = null;
            int? parentStatusId = null;
            if (statusId.HasValue)
            {
                (threadId, parentStatusId) = await ResolveThreadIds(statusId.Value);
            }

            int? quotedStatusId = n.Status?.QuotedStatusId;
            int? quotedThreadId = null;
            int? quotedParentStatusId = null;
            if (quotedStatusId.HasValue)
            {
                (quotedThreadId, quotedParentStatusId) = await ResolveThreadIds(quotedStatusId.Value);
            }

            result.Add(new
            {
                n.Id,
                n.CreatedAt,
                n.ActorId,
                Actor = new { n.Actor.Id, Username = n.Actor.Username },
                n.TargetUserId,
                n.Type,
                n.IsRead,
                StatusId = statusId,
                ThreadId = threadId,
                ParentStatusId = parentStatusId,
                QuotedStatusId = quotedStatusId,
                QuotedThreadId = quotedThreadId,
                QuotedParentStatusId = quotedParentStatusId,
                n.MessageId,
                Message = n.Message != null ? new { n.Message.Id, n.Message.Content } : null
            });
        }

        return Ok(result);
    }

    private async Task<(int? threadId, int? parentStatusId)> ResolveThreadIds(int statusId)
    {
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

    // PATCH /api/notifications/{id}/read - Marcar notificación como leída
    [Authorize]
    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
            return NotFound("Notification not found");

        // Verificar que la notificación pertenece al usuario
        if (notification.TargetUserId != currentUserId)
            return Forbid();

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // PATCH /api/notifications/read-all - Marcar todas como leídas
    [Authorize]
    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var unreadNotifications = await _context.Notifications
            .Where(n => n.TargetUserId == currentUserId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
}