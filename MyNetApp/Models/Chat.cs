using System.ComponentModel.DataAnnotations;
using MyNetApp.Models;

namespace MyNetApp.Models
{
    public class Chat
    {
        public int Id { get; set; } 
        public int User1Id { get; set; }
        public User User1 { get; set; } = null!;
        public int User2Id { get; set; }
        public User User2 { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // Navegación a los mensajes
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}