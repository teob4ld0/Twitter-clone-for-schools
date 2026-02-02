namespace MyNetApp.Models;

public class Repost
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // FK → User
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // FK → Status
    public int StatusId { get; set; }
    public Status Status { get; set; } = null!;
}