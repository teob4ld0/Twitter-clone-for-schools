namespace MyNetApp.Models;

public class ExpoPushToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string? DeviceType { get; set; } // "ios" o "android"
    public string? DeviceName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    
    // Navigation properties
    public User? User { get; set; }
}
