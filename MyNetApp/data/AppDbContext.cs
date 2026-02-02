using Microsoft.EntityFrameworkCore;
using MyNetApp.Models;

namespace MyNetApp.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
	public DbSet<Status> Statuses { get; set; }
	public DbSet<StatusLike> StatusLikes { get; set; }
	public DbSet<Repost> Reposts { get; set; }
    public DbSet<Follower> Followers { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<PushSubscription> PushSubscriptions { get; set; }
    public DbSet<InterestSignal> InterestSignals { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<StatusLike>()
            .HasKey(l => new { l.UserId, l.StatusId });

        modelBuilder.Entity<StatusLike>()
            .HasOne(l => l.User)
            .WithMany(u => u.StatusLikes)
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StatusLike>()
            .HasOne(l => l.Status)
            .WithMany(s => s.Likes)
            .HasForeignKey(l => l.StatusId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Repost>()
            .HasIndex(r => new { r.UserId, r.StatusId })
            .IsUnique();

        modelBuilder.Entity<Repost>()
            .HasOne(r => r.User)
            .WithMany(u => u.Reposts)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Repost>()
            .HasOne(r => r.Status)
            .WithMany(s => s.Reposts)
            .HasForeignKey(r => r.StatusId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Status>()
            .HasOne(s => s.User)
            .WithMany(u => u.Statuses)
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Status>()
            .HasOne(s => s.ParentStatus)
            .WithMany(s => s.Replies)
            .HasForeignKey(s => s.ParentStatusId)
            .OnDelete(DeleteBehavior.Cascade);

        // Quote: a Status can reference another Status as the quoted one.
        // Use SetNull so when quoted status is deleted, the quote remains but shows "deleted"
        modelBuilder.Entity<Status>()
            .HasOne(s => s.QuotedStatus)
            .WithMany()
            .HasForeignKey(s => s.QuotedStatusId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Status>()
            .HasIndex(s => s.QuotedStatusId);
    
        modelBuilder.Entity<Follower>()
            .HasOne(f => f.FollowerUser)
            .WithMany(u => u.Following)
            .HasForeignKey(f => f.FollowerId)
            .OnDelete(DeleteBehavior.Restrict);
    
        modelBuilder.Entity<Follower>()
            .HasOne(f => f.FollowingUser)
            .WithMany(u => u.Followers)
            .HasForeignKey(f => f.FollowingId)
            .OnDelete(DeleteBehavior.Restrict);
    
        // Prevent users from following themselves
        modelBuilder.Entity<Follower>()
            .HasIndex(f => new { f.FollowerId, f.FollowingId })
            .IsUnique();

        // Chat configuration
        modelBuilder.Entity<Chat>()
            .HasOne(c => c.User1)
            .WithMany()
            .HasForeignKey(c => c.User1Id)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Chat>()
            .HasOne(c => c.User2)
            .WithMany()
            .HasForeignKey(c => c.User2Id)
            .OnDelete(DeleteBehavior.Restrict);

        // Prevent duplicate chats between same users
        modelBuilder.Entity<Chat>()
            .HasIndex(c => new { c.User1Id, c.User2Id })
            .IsUnique();

        // Message configuration
        modelBuilder.Entity<Message>()
            .HasOne(m => m.Chat)
            .WithMany(c => c.Messages)
            .HasForeignKey(m => m.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Message>()
            .HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        // Notification configuration
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Actor)
            .WithMany()
            .HasForeignKey(n => n.ActorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.TargetUser)
            .WithMany()
            .HasForeignKey(n => n.TargetUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Optional relationships to Status, Message
		modelBuilder.Entity<Notification>()
			.HasOne(n => n.Status)
			.WithMany()
			.HasForeignKey(n => n.StatusId)
			.OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Message)
            .WithMany()
            .HasForeignKey(n => n.MessageId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for faster queries on target user's notifications
        modelBuilder.Entity<Notification>()
            .HasIndex(n => new { n.TargetUserId, n.IsRead, n.CreatedAt });

        // InterestSignal configuration
        modelBuilder.Entity<InterestSignal>()
            .HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InterestSignal>()
            .HasOne(i => i.Status)
            .WithMany()
            .HasForeignKey(i => i.StatusId)
            .OnDelete(DeleteBehavior.Cascade);

        // Index for analytics queries
        modelBuilder.Entity<InterestSignal>()
            .HasIndex(i => new { i.StatusId, i.SignalType, i.CreatedAt });
        
        modelBuilder.Entity<InterestSignal>()
            .HasIndex(i => new { i.UserId, i.StatusId, i.SignalType });
    }
}
