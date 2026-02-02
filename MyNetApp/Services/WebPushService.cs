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
        
        _logger.LogInformation($"WebPushService initialized with subject: {subject}");
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
            _logger.LogInformation($"No active push subscriptions found for user {userId}");
            return;
        }

        var payloadJson = JsonSerializer.Serialize(payload);
        _logger.LogInformation($"Sending push notification to user {userId} ({subscriptions.Count} subscription(s))");
        _logger.LogDebug($"Payload: {payloadJson}");

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
                _logger.LogInformation($"Push notification sent successfully to user {userId} (endpoint: {subscription.Endpoint.Substring(0, Math.Min(50, subscription.Endpoint.Length))}...)");
            }
            catch (WebPushException ex)
            {
                _logger.LogError(ex, $"WebPushException sending push to user {userId}: {ex.Message}, StatusCode: {ex.StatusCode}");
                
                // Si el subscription expiró o es inválido, eliminarlo
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone || 
                    ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _context.PushSubscriptions.Remove(subscription);
                    await _context.SaveChangesAsync();
                    _logger.LogWarning($"Removed invalid subscription for user {userId}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error sending push to user {userId}: {ex.Message}");
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
