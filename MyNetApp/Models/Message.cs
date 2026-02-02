namespace MyNetApp.Models
{
    public class Message
    {
        public int Id { get; set; }
        public int ChatId { get; set; }
        public Chat Chat { get; set; } = null!;
        public int SenderId { get; set; }
        public User Sender { get; set; } = null!;
        public string Content { get; set; } = string.Empty;

        // Media
        public string? MediaUrl { get; set; }

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}