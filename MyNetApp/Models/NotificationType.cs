namespace MyNetApp.Models;

public enum NotificationType
{
    Like = 1,          // Usuario dio like a un status
    ReplyOnStatus = 2, // Usuario respondió a un status (raíz)
    Follow = 3,     // Usuario siguió a otro usuario
    Message = 4,    // Usuario envió un mensaje
    ReplyOnReply = 5,  // Usuario respondió a una respuesta
    Mention = 6,     // Usuario mencionó a otro usuario
    Repost = 7,      // Usuario hizo repost
    Quote = 8        // Usuario hizo quote (repost con comentario)
}
