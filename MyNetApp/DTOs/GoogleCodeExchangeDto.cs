namespace MyNetApp.DTOs;

public class GoogleCodeExchangeDto
{
    public string Code { get; set; } = null!;
    public string? State { get; set; }

    // Optional user-provided registration info (sent by frontend after Google redirects back)
    public string? Email { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
}
