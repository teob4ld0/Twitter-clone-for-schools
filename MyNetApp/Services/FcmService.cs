using Google.Apis.Auth.OAuth2;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace MyNetApp.Services;

/// <summary>
/// Servicio para enviar notificaciones push usando Firebase Cloud Messaging (FCM) API V1
/// </summary>
public class FcmService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<FcmService> _logger;
    private readonly string _projectId;
    private GoogleCredential? _credential;

    public FcmService(
        IHttpClientFactory httpClientFactory,
        ILogger<FcmService> logger,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        
        // Leer projectId de configuración
        _projectId = configuration["Firebase:ProjectId"] ?? "twittetec";
        
        InitializeCredentials(configuration);
    }

    private void InitializeCredentials(IConfiguration configuration)
    {
        try
        {
            // Leer ruta del archivo service account de configuración
            var serviceAccountFileName = configuration["Firebase:ServiceAccountFilePath"] ?? "firebase-service-account.json";
            var serviceAccountPath = Path.Combine(Directory.GetCurrentDirectory(), serviceAccountFileName);
            
            if (!File.Exists(serviceAccountPath))
            {
                _logger.LogWarning($"Firebase service account file not found at {serviceAccountPath}");
                _logger.LogWarning("FCM notifications will not work. Please add firebase-service-account.json to project root.");
                return;
            }

            using var stream = new FileStream(serviceAccountPath, FileMode.Open, FileAccess.Read);
            _credential = GoogleCredential.FromStream(stream)
                .CreateScoped("https://www.googleapis.com/auth/firebase.messaging");
            
            _logger.LogInformation($"Firebase credentials loaded successfully for project '{_projectId}'");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading Firebase credentials");
        }
    }

    /// <summary>
    /// Enviar notificación FCM usando un FCM Device Token nativo
    /// IMPORTANTE: El token debe ser un FCM device token real (obtenido con getDevicePushTokenAsync),
    /// NO un Expo Push Token (formato ExponentPushToken[xxx]). Esos solo funcionan con Expo service.
    /// </summary>
    /// <param name="expoPushToken">FCM device registration token del dispositivo</param>
    /// <param name="title">Título de la notificación</param>
    /// <param name="body">Cuerpo del mensaje</param>
    /// <param name="data">Datos adicionales para enviar con la notificación</param>
    public async Task<bool> SendNotificationAsync(string expoPushToken, string title, string body, Dictionary<string, string>? data = null)
    {
        if (_credential == null)
        {
            _logger.LogWarning("Cannot send FCM notification: credentials not loaded");
            return false;
        }

        try
        {
            // Obtener access token
            var accessToken = await _credential.UnderlyingCredential.GetAccessTokenForRequestAsync();

            // Preparar el mensaje FCM
            var message = new
            {
                message = new
                {
                    token = expoPushToken, // Usar el token directamente (debe ser FCM device token)
                    notification = new
                    {
                        title = title,
                        body = body
                    },
                    data = data ?? new Dictionary<string, string>(),
                    android = new
                    {
                        priority = "high",
                        notification = new
                        {
                            sound = "default",
                            channel_id = "default"
                        }
                    }
                }
            };

            var httpClient = _httpClientFactory.CreateClient();
            var requestUrl = $"https://fcm.googleapis.com/v1/projects/{_projectId}/messages:send";
            
            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
            request.Content = new StringContent(
                JsonSerializer.Serialize(message),
                Encoding.UTF8,
                "application/json"
            );

            var response = await httpClient.SendAsync(request);
            var responseContent = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation($"FCM notification sent successfully to {expoPushToken}");
                return true;
            }
            else
            {
                _logger.LogError($"FCM notification failed: {response.StatusCode} - {responseContent}");
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error sending FCM notification to {expoPushToken}");
            return false;
        }
    }
}
