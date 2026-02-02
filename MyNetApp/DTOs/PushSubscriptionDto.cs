using System.Text.Json.Serialization;

namespace MyNetApp.DTOs;

public class PushSubscriptionDto
{
    [JsonPropertyName("endpoint")]
    public string Endpoint { get; set; } = string.Empty;
    
    [JsonPropertyName("expirationTime")]
    public long? ExpirationTime { get; set; }
    
    [JsonPropertyName("keys")]
    public PushKeysDto Keys { get; set; } = new();
}

public class PushKeysDto
{
    [JsonPropertyName("p256dh")]
    public string P256dh { get; set; } = string.Empty;
    
    [JsonPropertyName("auth")]
    public string Auth { get; set; } = string.Empty;
}
