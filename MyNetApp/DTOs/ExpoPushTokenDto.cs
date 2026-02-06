namespace MyNetApp.DTOs;

public class ExpoPushTokenDto
{
    public string Token { get; set; } = string.Empty;
    public string? DeviceType { get; set; }
    public string? DeviceName { get; set; }
}
