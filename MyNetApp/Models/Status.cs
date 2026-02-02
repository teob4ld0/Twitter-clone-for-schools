namespace MyNetApp.Models;

public class Status
{
    public int Id { get; set; }

    public string Content { get; set; } = null!;

    // Media
    public string? MediaUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Author
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    // Threading: if null => root status, else => reply
    public int? ParentStatusId { get; set; }
    public Status? ParentStatus { get; set; }
    public ICollection<Status> Replies { get; set; } = new List<Status>();

    // Likes
    public ICollection<StatusLike> Likes { get; set; } = new List<StatusLike>(); //Simplemente para hacer la cuenta de likes

    public ICollection<Repost> Reposts { get; set; } = new List<Repost>(); //Simplemente para hacer la cuenta de reposts

    // Quotes
    public int? QuotedStatusId { get; set; }
    public Status? QuotedStatus { get; set; }
    public ICollection<Status> Quotes { get; set; } = new List<Status>(); // Status que citan a este status


}