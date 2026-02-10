using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.Models;
using WebPush;
using System.Text.Json;

namespace MyNetApp.Services;

public class WebPushService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly WebPushClient _webPushClient;
    private readonly VapidDetails _vapidDetails;
    private readonly ILogger<WebPushService> _logger;

    public WebPushService(AppDbContext context, IConfiguration configuration, ILogger<WebPushService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        
        // Configurar VAPID
        var publicKey = _configuration["VapidKeys:PublicKey"];
        var privateKey = _configuration["VapidKeys:PrivateKey"];
        var subject = _configuration["VapidKeys:Subject"];

        if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey))
        {
            throw new InvalidOperationException("VAPID keys not configured in appsettings.json");
        }

        _vapidDetails = new VapidDetails(subject, publicKey, privateKey);
        _webPushClient = new WebPushClient();
    }

    // Enviar notificación push a un usuario específico
    public async Task SendNotificationToUserAsync(int userId, object payload)
    {
        // Obtener todas las suscripciones activas del usuario
        var subscriptions = await _context.PushSubscriptions
            .Where(s => s.UserId == userId && s.IsActive)
            .ToListAsync();

        if (!subscriptions.Any())
        {
            return;
        }

        var payloadJson = JsonSerializer.Serialize(payload);

        // Enviar a todas las suscripciones del usuario (puede tener múltiples dispositivos)
        var tasks = subscriptions.Select(async subscription =>
        {
            try
            {
                var pushSubscription = new WebPush.PushSubscription(
                    subscription.Endpoint,
                    subscription.P256dh,
                    subscription.Auth
                );

                await _webPushClient.SendNotificationAsync(pushSubscription, payloadJson, _vapidDetails);
            }
            catch (WebPushException ex)
            {
                _logger.LogError(ex, $"WebPushException sending push to user {userId}");
                
                // Si el subscription expiró o es inválido, eliminarlo
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone || 
                    ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _context.PushSubscriptions.Remove(subscription);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error sending push to user {userId}");
            }
        });

        await Task.WhenAll(tasks);
    }

    // Enviar notificación a múltiples usuarios
    public async Task SendNotificationToUsersAsync(IEnumerable<int> userIds, object payload)
    {
        var tasks = userIds.Select(userId => SendNotificationToUserAsync(userId, payload));
        await Task.WhenAll(tasks);
    }

    // Verificar si un usuario tiene suscripciones activas
    public async Task<bool> HasActiveSubscriptionsAsync(int userId)
    {
        return await _context.PushSubscriptions.AnyAsync(s => s.UserId == userId && s.IsActive);
    }

    // Obtener clave pública VAPID
    public string GetPublicKey()
    {
        return _configuration["VapidKeys:PublicKey"] ?? throw new InvalidOperationException("VAPID public key not configured");
    }
}
