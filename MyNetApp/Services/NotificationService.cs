using Microsoft.AspNetCore.SignalR;
using MyNetApp.Hubs;
using MyNetApp.Data;
using MyNetApp.Models;

namespace MyNetApp.Services;

public class NotificationService
{
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly AppDbContext _context;
    private readonly WebPushService _webPushService;

    public NotificationService(
        IHubContext<NotificationHub> notificationHub, 
        AppDbContext context,
        WebPushService webPushService)
    {
        _notificationHub = notificationHub;
        _context = context;
        _webPushService = webPushService;
    }

    public async Task<Notification> SendNotificationAsync(
        int targetUserId,
        int actorId,
        NotificationType type,
        int? statusId = null,
        int? messageId = null)
    {
        var notification = new Notification
        {
            TargetUserId = targetUserId,
            ActorId = actorId,
            Type = type,
            StatusId = statusId,
            MessageId = messageId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        await _context.Entry(notification).Reference(n => n.Actor).LoadAsync();
        if (statusId.HasValue)
            await _context.Entry(notification).Reference(n => n.Status).LoadAsync();
        if (messageId.HasValue)
            await _context.Entry(notification).Reference(n => n.Message).LoadAsync();

        // Preparar payload para notificación
        var notificationPayload = new
        {
            id = notification.Id,
            actorId = notification.ActorId,
            actorUsername = notification.Actor.Username,
            type = notification.Type.ToString(),
            statusId = notification.StatusId,
            messageId = notification.MessageId,
            isRead = notification.IsRead,
            createdAt = notification.CreatedAt
        };

        // Intentar enviar por SignalR (si usuario está conectado)
        await _notificationHub.Clients
            .Group($"user_{targetUserId}")
            .SendAsync("ReceiveNotification", notificationPayload);

        // Enviar notificación push si el usuario tiene suscripciones
        // (útil si el usuario no está conectado por SignalR)
        try
        {
            await _webPushService.SendNotificationToUserAsync(targetUserId, new
            {
                title = GetNotificationTitle(type, notification.Actor.Username),
                body = GetNotificationBody(type, notification.Actor.Username),
                icon = "/icon-192.png",
                badge = "/badge-72.png",
                data = notificationPayload,
                tag = $"notification-{notification.Id}",
                requireInteraction = false
            });
        }
        catch (Exception ex)
        {
            // Log pero no fallar si push falla
            Console.WriteLine($"Failed to send push notification: {ex.Message}");
        }

        return notification;
    }

    private string GetNotificationTitle(NotificationType type, string actorUsername)
    {
        return type switch
        {
            NotificationType.Like => "Nueva reacción",
            NotificationType.ReplyOnStatus => "Nueva respuesta",
            NotificationType.ReplyOnReply => "Nueva respuesta",
            NotificationType.Repost => "Nuevo repost",
            NotificationType.Follow => "Nuevo seguidor",
            NotificationType.Message => "Nuevo mensaje",
            NotificationType.Quote => "Te citaron",
            NotificationType.Mention => "Te mencionaron",
            _ => "Nueva notificación"
        };
    }

    private string GetNotificationBody(NotificationType type, string actorUsername)
    {
        return type switch
        {
            NotificationType.Like => $"{actorUsername} le gustó tu publicación",
            NotificationType.ReplyOnStatus => $"{actorUsername} respondió a tu publicación",
            NotificationType.ReplyOnReply => $"{actorUsername} respondió a tu comentario",
            NotificationType.Repost => $"{actorUsername} reposteó tu publicación",
            NotificationType.Follow => $"{actorUsername} comenzó a seguirte",
            NotificationType.Message => $"{actorUsername} te envió un mensaje",
            NotificationType.Quote => $"{actorUsername} citó tu publicación",
            NotificationType.Mention => $"{actorUsername} te mencionó",
            _ => $"Nueva notificación de {actorUsername}"
        };
    }
}
