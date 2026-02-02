namespace MyNetApp.Models
{
    public class Follower
    {
        public int Id { get; set; }

        // The user who is following someone
        public int FollowerId { get; set; }
        public User FollowerUser { get; set; } = null!;

        // The user being followed
        public int FollowingId { get; set; }
        public User FollowingUser { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}