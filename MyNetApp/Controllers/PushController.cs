using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using MyNetApp.Services;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/push")]
public class PushController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly WebPushService _webPushService;
    private readonly ExpoPushService _expoPushService;
    private readonly ILogger<PushController> _logger;

    public PushController(
        AppDbContext context, 
        WebPushService webPushService,
        ExpoPushService expoPushService,
        ILogger<PushController> logger)
    {
        _context = context;
        _webPushService = webPushService;
        _expoPushService = expoPushService;
        _logger = logger;
    }

    // GET /api/push/public-key - Obtener clave pública VAPID
    [HttpGet("public-key")]
    public IActionResult GetPublicKey()
    {
        try
        {
            var publicKey = _webPushService.GetPublicKey();
            _logger.LogInformation($"Public key requested: {publicKey?.Substring(0, Math.Min(20, publicKey?.Length ?? 0))}...");
            return Ok(new { publicKey });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting public key: {ex.Message}");
            return StatusCode(500, new { message = "Error getting public key", error = ex.Message });
        }
    }

    // POST /api/push/subscribe - Registrar suscripción push
    [Authorize]
    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe([FromBody] PushSubscriptionDto subscriptionDto)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            _logger.LogInformation($"Subscribe request from user {currentUserId}");
            _logger.LogInformation($"Endpoint: {subscriptionDto?.Endpoint}");
            _logger.LogInformation($"Keys: p256dh={subscriptionDto?.Keys?.P256dh?.Length}, auth={subscriptionDto?.Keys?.Auth?.Length}");

            // Validar datos
            if (string.IsNullOrEmpty(subscriptionDto.Endpoint) ||
                string.IsNullOrEmpty(subscriptionDto.Keys.P256dh) ||
                string.IsNullOrEmpty(subscriptionDto.Keys.Auth))
            {
                _logger.LogWarning("Invalid subscription data received");
                return BadRequest(new { message = "Invalid subscription data" });
            }

            // Verificar si ya existe esta suscripción
            var existingSubscription = await _context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.Endpoint == subscriptionDto.Endpoint);

            if (existingSubscription != null)
            {
                _logger.LogInformation($"Subscription already exists for endpoint: {subscriptionDto.Endpoint}");
                // Si existe pero es de otro usuario, actualizarla
                if (existingSubscription.UserId != currentUserId)
                {
                    existingSubscription.UserId = currentUserId;
                    existingSubscription.P256dh = subscriptionDto.Keys.P256dh;
                    existingSubscription.Auth = subscriptionDto.Keys.Auth;
                    existingSubscription.IsActive = true;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Updated subscription for user {currentUserId}");
                }
                
                return Ok(new { message = "Subscription already exists" });
            }

            // Crear nueva suscripción
            var pushSubscription = new PushSubscription
            {
                UserId = currentUserId,
                Endpoint = subscriptionDto.Endpoint,
                P256dh = subscriptionDto.Keys.P256dh,
                Auth = subscriptionDto.Keys.Auth,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.PushSubscriptions.Add(pushSubscription);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Subscription created successfully for user {currentUserId}, id: {pushSubscription.Id}");

            return Ok(new { message = "Subscription created successfully", id = pushSubscription.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error in Subscribe: {ex.Message}");
            
            // Capturar inner exception si existe
            var innerError = ex.InnerException?.Message ?? "No inner exception";
            var innerStackTrace = ex.InnerException?.StackTrace ?? "No inner stack trace";
            
            _logger.LogError($"Inner exception: {innerError}");
            
            return StatusCode(500, new { 
                message = "Internal server error", 
                error = ex.Message, 
                innerError = innerError,
                stackTrace = ex.StackTrace,
                innerStackTrace = innerStackTrace
            });
        }
    }

    // POST /api/push/unsubscribe - Eliminar suscripción push
    [Authorize]
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] PushSubscriptionDto subscriptionDto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var subscription = await _context.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == subscriptionDto.Endpoint && s.UserId == currentUserId);

        if (subscription == null)
        {
            return NotFound(new { message = "Subscription not found" });
        }

        _context.PushSubscriptions.Remove(subscription);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Subscription removed successfully" });
    }

    // DELETE /api/push/unsubscribe-all - Eliminar todas las suscripciones del usuario
    [Authorize]
    [HttpDelete("unsubscribe-all")]
    public async Task<IActionResult> UnsubscribeAll()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var subscriptions = await _context.PushSubscriptions
            .Where(s => s.UserId == currentUserId)
            .ToListAsync();

        if (!subscriptions.Any())
        {
            return Ok(new { message = "No subscriptions found" });
        }

        _context.PushSubscriptions.RemoveRange(subscriptions);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"{subscriptions.Count} subscription(s) removed successfully" });
    }

    // GET /api/push/subscriptions - Obtener suscripciones del usuario (para debugging)
    [Authorize]
    [HttpGet("subscriptions")]
    public async Task<IActionResult> GetSubscriptions()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var subscriptions = await _context.PushSubscriptions
            .Where(s => s.UserId == currentUserId)
            .Select(s => new
            {
                s.Id,
                s.Endpoint,
                s.IsActive,
                s.CreatedAt
            })
            .ToListAsync();

        return Ok(subscriptions);
    }

    // POST /api/push/test - Enviar notificación de prueba (para debugging)
    [Authorize]
    [HttpPost("test")]
    public async Task<IActionResult> SendTestNotification()
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            _logger.LogInformation($"Sending test notification to user {currentUserId}");

            // Verificar si hay suscripciones activas
            var hasSubscriptions = await _webPushService.HasActiveSubscriptionsAsync(currentUserId);
            
            if (!hasSubscriptions)
            {
                _logger.LogWarning($"No active subscriptions found for user {currentUserId}");
                return BadRequest(new { message = "No active push subscriptions found. Please subscribe first." });
            }

            // Enviar notificación de prueba
            await _webPushService.SendNotificationToUserAsync(currentUserId, new
            {
                title = "Notificación de prueba",
                body = "Esta es una notificación de prueba desde MyNetApp",
                icon = "/icon-192.png",
                badge = "/badge-72.png",
                data = new
                {
                    type = "test",
                    timestamp = DateTime.UtcNow
                },
                tag = "test-notification",
                requireInteraction = false
            });

            _logger.LogInformation($"Test notification sent successfully to user {currentUserId}");

            return Ok(new { message = "Test notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending test notification: {ex.Message}");
            return StatusCode(500, new { 
                message = "Error sending test notification", 
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    // ==================== EXPO PUSH NOTIFICATIONS ====================

    // POST /api/push/expo/register - Registrar Expo Push Token
    [Authorize]
    [HttpPost("expo/register")]
    public async Task<IActionResult> RegisterExpoToken([FromBody] ExpoPushTokenDto tokenDto)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            _logger.LogInformation($"Expo token registration request from user {currentUserId}");
            _logger.LogInformation($"Token: {tokenDto.Token}");

            // Validar token
            if (string.IsNullOrEmpty(tokenDto.Token))
            {
                _logger.LogWarning("Invalid Expo token received");
                return BadRequest(new { message = "Invalid token" });
            }

            // Verificar si ya existe este token
            var existingToken = await _context.ExpoPushTokens
                .FirstOrDefaultAsync(t => t.Token == tokenDto.Token);

            if (existingToken != null)
            {
                _logger.LogInformation($"Expo token already exists for user {existingToken.UserId}");
                
                // Si existe pero es de otro usuario, actualizarlo
                if (existingToken.UserId != currentUserId)
                {
                    existingToken.UserId = currentUserId;
                    existingToken.DeviceType = tokenDto.DeviceType;
                    existingToken.DeviceName = tokenDto.DeviceName;
                    existingToken.IsActive = true;
                    existingToken.LastUsedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    _logger.LogInformation($"Updated Expo token for user {currentUserId}");
                }
                else
                {
                    // Actualizar última vez usado
                    existingToken.LastUsedAt = DateTime.UtcNow;
                    existingToken.IsActive = true;
                    await _context.SaveChangesAsync();
                }
                
                return Ok(new { message = "Token already registered", id = existingToken.Id });
            }

            // Crear nuevo token
            var expoPushToken = new ExpoPushToken
            {
                UserId = currentUserId,
                Token = tokenDto.Token,
                DeviceType = tokenDto.DeviceType,
                DeviceName = tokenDto.DeviceName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastUsedAt = DateTime.UtcNow
            };

            _context.ExpoPushTokens.Add(expoPushToken);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation($"Expo token registered successfully for user {currentUserId}, id: {expoPushToken.Id}");

            return Ok(new { message = "Token registered successfully", id = expoPushToken.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error registering Expo token: {ex.Message}");
            return StatusCode(500, new { 
                message = "Internal server error", 
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }

    // DELETE /api/push/expo/unregister - Eliminar Expo Push Token
    [Authorize]
    [HttpDelete("expo/unregister")]
    public async Task<IActionResult> UnregisterExpoToken([FromBody] ExpoPushTokenDto tokenDto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var token = await _context.ExpoPushTokens
            .FirstOrDefaultAsync(t => t.Token == tokenDto.Token && t.UserId == currentUserId);

        if (token == null)
        {
            return NotFound(new { message = "Token not found" });
        }

        _context.ExpoPushTokens.Remove(token);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"Expo token removed for user {currentUserId}");
        return Ok(new { message = "Token removed successfully" });
    }

    // DELETE /api/push/expo/unregister-all - Eliminar todos los Expo tokens del usuario
    [Authorize]
    [HttpDelete("expo/unregister-all")]
    public async Task<IActionResult> UnregisterAllExpoTokens()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var tokens = await _context.ExpoPushTokens
            .Where(t => t.UserId == currentUserId)
            .ToListAsync();

        if (!tokens.Any())
        {
            return Ok(new { message = "No tokens found" });
        }

        _context.ExpoPushTokens.RemoveRange(tokens);
        await _context.SaveChangesAsync();

        _logger.LogInformation($"{tokens.Count} Expo token(s) removed for user {currentUserId}");
        return Ok(new { message = $"{tokens.Count} token(s) removed successfully" });
    }

    // GET /api/push/expo/tokens - Obtener tokens Expo del usuario (debugging)
    [Authorize]
    [HttpGet("expo/tokens")]
    public async Task<IActionResult> GetExpoTokens()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var tokens = await _context.ExpoPushTokens
            .Where(t => t.UserId == currentUserId)
            .Select(t => new
            {
                t.Id,
                t.Token,
                t.DeviceType,
                t.DeviceName,
                t.IsActive,
                t.CreatedAt,
                t.LastUsedAt
            })
            .ToListAsync();

        return Ok(tokens);
    }

    // POST /api/push/expo/test - Enviar notificación de prueba Expo
    [Authorize]
    [HttpPost("expo/test")]
    public async Task<IActionResult> SendTestExpoNotification()
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            
            _logger.LogInformation($"Sending test Expo notification to user {currentUserId}");

            // Verificar si hay tokens activos
            var hasTokens = await _expoPushService.HasActiveTokensAsync(currentUserId);
            
            if (!hasTokens)
            {
                _logger.LogWarning($"No active Expo tokens found for user {currentUserId}");
                return BadRequest(new { message = "No active Expo push tokens found. Please register first." });
            }

            // Enviar notificación de prueba
            await _expoPushService.SendNotificationToUserAsync(currentUserId, new
            {
                title = "Notificación de prueba",
                body = "Esta es una notificación de prueba desde MyNetApp (Expo)",
                data = new
                {
                    type = "test",
                    timestamp = DateTime.UtcNow
                }
            });

            _logger.LogInformation($"Test Expo notification sent successfully to user {currentUserId}");

            return Ok(new { message = "Test notification sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending test Expo notification: {ex.Message}");
            return StatusCode(500, new { 
                message = "Error sending test notification", 
                error = ex.Message,
                innerError = ex.InnerException?.Message
            });
        }
    }
}
