namespace MyNetApp.Models;

public class Notification
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Usuario que genera la notificación (quien da like, comenta, sigue, etc.)
    public int ActorId { get; set; }
    public User Actor { get; set; } = null!;

    // Usuario que recibe la notificación
    public int TargetUserId { get; set; }
    public User TargetUser { get; set; } = null!;

    // Tipo de notificación
    public NotificationType Type { get; set; }

    // ¿Fue leída?
    public bool IsRead { get; set; } = false;

    // Referencia opcional a entidad relacionada
    public int? StatusId { get; set; }
    public Status? Status { get; set; }

    public int? MessageId { get; set; }
    public Message? Message { get; set; }
}
