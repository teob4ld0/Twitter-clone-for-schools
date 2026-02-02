namespace MyNetApp.DTOs;

// DTO para obtener una señal individual (GET)
public class GetInterestSignalDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = null!;
    public int StatusId { get; set; }
    public string SignalType { get; set; } = null!;
    public int Value { get; set; }
    public string? Metadata { get; set; }
    public DateTime CreatedAt { get; set; }
}
