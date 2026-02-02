namespace MyNetApp.DTOs;

public class RecordInterestSignalDto
{
    public int? StatusId { get; set; } // Nullable para señales como follow/unfollow que no están asociadas a un status
    public string SignalType { get; set; } = null!; // "view_time", "follow", "unfollow", etc.
    public int Value { get; set; } // Para view_time: milisegundos de visualización
    public string? Metadata { get; set; } // Información adicional opcional
}
