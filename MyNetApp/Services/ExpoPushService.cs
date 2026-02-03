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
    private readonly ILogger<ExpoPushService> _logger;
    private const string EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    public ExpoPushService(
        AppDbContext context, 
        IHttpClientFactory httpClientFactory,
        ILogger<ExpoPushService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Enviar notificación push a un usuario específico usando Expo Push Notifications
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

        _logger.LogInformation($"Sending Expo push notification to user {userId} ({tokens.Count} device(s))");

        // Preparar mensajes para cada token
        var messages = tokens.Select(token => (object)new
        {
            to = token.Token,
            sound = "default",
            title = GetPropertyValue(payload, "title") ?? "Nueva notificación",
            body = GetPropertyValue(payload, "body") ?? "",
            data = payload,
            badge = 1,
            priority = "high"
        }).ToList();

        // Enviar notificaciones en lotes (Expo permite hasta 100 por request)
        var batches = messages.Chunk(100);

        foreach (var batch in batches)
        {
            await SendBatchAsync(batch.ToList(), userId);
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
    /// Enviar un lote de notificaciones a Expo
    /// </summary>
    private async Task SendBatchAsync(List<object> messages, int userId)
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            var json = JsonSerializer.Serialize(messages);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _logger.LogDebug($"Sending {messages.Count} Expo notifications");

            var response = await httpClient.PostAsync(EXPO_PUSH_URL, content);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"Expo notifications sent successfully to user {userId}");
                
                // Parsear respuesta para detectar errores en tokens individuales
                await HandleExpoResponseAsync(responseContent, userId);
            }
            else
            {
                _logger.LogError($"Error sending Expo notifications: {response.StatusCode} - {responseContent}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Exception sending Expo push notifications to user {userId}: {ex.Message}");
        }
    }

    /// <summary>
    /// Procesar respuesta de Expo para detectar tokens inválidos
    /// </summary>
    private async Task HandleExpoResponseAsync(string responseJson, int userId)
    {
        try
        {
            var response = JsonSerializer.Deserialize<ExpoResponse>(responseJson);
            
            if (response?.Data == null) return;

            var tokensToRemove = new List<string>();

            for (int i = 0; i < response.Data.Count; i++)
            {
                var ticketData = response.Data[i];
                
                // Si hay error, verificar si el token es inválido
                if (ticketData.Status == "error")
                {
                    var errorType = GetPropertyValue(ticketData.Details, "error");
                    
                    // Errores que indican que el token debe ser removido
                    if (errorType is "DeviceNotRegistered" or "InvalidCredentials" or "MessageTooBig")
                    {
                        _logger.LogWarning($"Invalid Expo token detected for user {userId}: {errorType}");
                        // Aquí podríamos marcar el token como inactivo
                        // Necesitaríamos correlacionar el índice con el token específico
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Expo response");
        }
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

    // Clases para deserializar respuesta de Expo
    private class ExpoResponse
    {
        public List<ExpoTicket>? Data { get; set; }
    }

    private class ExpoTicket
    {
        public string Status { get; set; } = string.Empty;
        public string? Id { get; set; }
        public string? Message { get; set; }
        public object? Details { get; set; }
    }
}
