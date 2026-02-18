namespace MyNetApp.Models;

public class Report
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // FK -> User (quien reporta)
    public int UserId { get; set; }
    public User Reporter { get; set; } = null!;

    // FK -> Status (si el reporte es sobre un status, si no, null)
    public int? StatusId { get; set; }
    public Status? Status { get; set; }

    // FK -> OtherUser (si el reporte es sobre otro usuario, si no, null)
    public int? OtherUserId { get; set; }
    public User? OtherUser { get; set; }

    // Razón del reporte
    public ReportReason Type { get; set; }
}
