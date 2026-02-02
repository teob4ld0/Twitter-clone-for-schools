namespace MyNetApp.Models;

public class InterestSignal
{
    public int Id { get; set; }

    // Usuario que genera la señal
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Status sobre el cual se generó la señal (nullable para señales sin status asociado como follow/unfollow)
    public int? StatusId { get; set; }
    public Status? Status { get; set; }

    // Tipo de señal
    public string SignalType { get; set; } = null!; // "view_time", "scroll_pause", "click", etc.

    // Valor de la señal (en milisegundos para view_time)
    public int Value { get; set; }

    // Metadata adicional opcional (JSON string)
    public string? Metadata { get; set; }

    // Timestamp
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
