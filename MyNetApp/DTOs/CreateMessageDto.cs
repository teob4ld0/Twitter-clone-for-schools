namespace MyNetApp.DTOs;

public class CreateMessageDto
{
    public string Content { get; set; } = null!;

    // Optional media URL obtained from /api/media/upload
    public string? MediaUrl { get; set; }
}