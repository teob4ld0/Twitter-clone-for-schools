using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.Models;
using System.Text;
using System.Text.Json;

namespace MyNetApp.Services;

public class ExpoPushService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly FcmService _fcmService;
    private readonly ILogger<ExpoPushService> _logger;

    public ExpoPushService(
        AppDbContext context,
        IHttpClientFactory httpClientFactory,
        FcmService fcmService,
        ILogger<ExpoPushService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _fcmService = fcmService;
        _logger = logger;
    }

    /// <summary>
    /// Enviar notificación push a un usuario específico usando FCM
    /// IMPORTANTE: Los tokens almacenados deben ser FCM device tokens nativos,
    /// NO Expo Push Tokens. El frontend debe usar getDevicePushTokenAsync()
    /// </summary>
    public async Task SendNotificationToUserAsync(int userId, object payload)
    {
        // Obtener todos los tokens activos del usuario
        var tokens = await _context.ExpoPushTokens
            .Where(t => t.UserId == userId && t.IsActive)
            .ToListAsync();

        if (!tokens.Any())
        {
            _logger.LogInformation($"No active Expo push tokens found for user {userId}");
            return;
        }

        _logger.LogInformation($"Sending push notification to user {userId} ({tokens.Count} device(s))");

        // Extraer título y cuerpo del payload
        var title = GetPropertyValue(payload, "title") ?? "Nueva notificación";
        var body = GetPropertyValue(payload, "body") ?? "";
        var data = ExtractDataDictionary(payload);

        // Enviar a cada token
        foreach (var token in tokens)
        {
            try
            {
                await _fcmService.SendNotificationAsync(token.Token, title, body, data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification to token {token.Token}");
            }
        }
    }

    /// <summary>
    /// Enviar notificación a múltiples usuarios
    /// </summary>
    public async Task SendNotificationToUsersAsync(IEnumerable<int> userIds, object payload)
    {
        var tasks = userIds.Select(userId => SendNotificationToUserAsync(userId, payload));
        await Task.WhenAll(tasks);
    }

    /// <summary>
    /// Verificar si un usuario tiene tokens activos
    /// </summary>
    public async Task<bool> HasActiveTokensAsync(int userId)
    {
        return await _context.ExpoPushTokens.AnyAsync(t => t.UserId == userId && t.IsActive);
    }

    /// <summary>
    /// Obtener valor de propiedad de un objeto dinámico
    /// </summary>
    private string? GetPropertyValue(object obj, string propertyName)
    {
        if (obj == null) return null;

        var type = obj.GetType();
        var property = type.GetProperty(propertyName, 
            System.Reflection.BindingFlags.IgnoreCase | 
            System.Reflection.BindingFlags.Public | 
            System.Reflection.BindingFlags.Instance);

        return property?.GetValue(obj)?.ToString();
    }

    /// <summary>
    /// Extraer diccionario de datos del payload
    /// </summary>
    private Dictionary<string, string> ExtractDataDictionary(object payload)
    {
        var result = new Dictionary<string, string>();
        
        try
        {
            var type = payload.GetType();
            var dataProperty = type.GetProperty("data");
            
            if (dataProperty != null)
            {
                var dataValue = dataProperty.GetValue(payload);
                if (dataValue != null)
                {
                    var dataType = dataValue.GetType();
                    foreach (var prop in dataType.GetProperties())
                    {
                        var value = prop.GetValue(dataValue)?.ToString();
                        if (value != null)
                        {
                            result[prop.Name] = value;
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error extracting data dictionary from payload");
        }
        
        return result;
    }
}
