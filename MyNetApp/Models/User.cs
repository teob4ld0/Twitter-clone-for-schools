using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Security.Cryptography;
using System.Text;

namespace MyNetApp.Models;

public class User
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(25)]
    public string Username { get; set; } = null!;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
    
    public string PasswordHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool EmailVerified { get; set; } = false;
    public string? EmailVerificationToken { get; set; }
    public DateTime? EmailVerificationTokenExpiry { get; set; }
	public ICollection<Status> Statuses { get; set; } = new List<Status>();
	public ICollection<StatusLike> StatusLikes { get; set; } = new List<StatusLike>();
	public ICollection<Repost> Reposts { get; set; } = new List<Repost>();
    // Users who follow this user
    public ICollection<Follower> Followers { get; set; } = new List<Follower>();
    // Users this user is following
    public ICollection<Follower> Following { get; set; } = new List<Follower>();
    // profile picture URL
    public string? ProfilePictureUrl { get; set; }

    public bool Banned { get; set; } = false;

    // Legacy column – kept for DB compatibility, no longer used
    public string? E2EEPublicKey { get; set; }

    // Deterministic per-user hash for chat encryption key derivation
    [NotMapped]
    public string PublicKeyHash =>
        Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes($"{Id}:{Email}:{CreatedAt:O}"))
        ).ToLowerInvariant();
}
