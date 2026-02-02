using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Hubs;
using MyNetApp.Models;
using MyNetApp.Services;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/chats")]
public class ChatController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IHubContext<NotificationHub> _notificationHubContext;
    private readonly NotificationService _notificationService;

    public ChatController(AppDbContext context, IHubContext<ChatHub> hubContext, IHubContext<NotificationHub> notificationHubContext, NotificationService notificationService)
    {
        _context = context;
        _hubContext = hubContext;
        _notificationHubContext = notificationHubContext;
        _notificationService = notificationService;
    }

    // Crear o recuperar chat
    [Authorize]
    [HttpPost("{otherUserId}")]
    public async Task<ActionResult<object>> CreateOrGetChat(int otherUserId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (currentUserId == otherUserId)
            return BadRequest("Cannot create chat with yourself");

        // Verificar que el otro usuario existe
        var otherUserExists = await _context.Users.AnyAsync(u => u.Id == otherUserId);
        if (!otherUserExists)
            return NotFound("User not found");

        // Ordenar IDs (el menor siempre es User1)
        int user1Id = Math.Min(currentUserId, otherUserId);
        int user2Id = Math.Max(currentUserId, otherUserId);

        // Buscar chat existente
        var existingChat = await _context.Chats
            .Where(c => c.User1Id == user1Id && c.User2Id == user2Id)
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .FirstOrDefaultAsync();

        if (existingChat != null)
        {
            var existingDto = new
            {
                existingChat.Id,
                existingChat.User1Id,
                existingChat.User2Id,
                existingChat.CreatedAt,
                OtherUser = existingChat.User1Id == currentUserId ? existingChat.User2 : existingChat.User1,
                LastMessage = existingChat.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault(),
                UnreadCount = existingChat.Messages.Count(m => m.SenderId != currentUserId && !m.IsRead)
            };
            return Ok(existingDto);
        }

        // Crear nuevo chat
        var chat = new Chat
        {
            User1Id = user1Id,
            User2Id = user2Id
        };

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync();

        // Cargar las relaciones
        await _context.Entry(chat).Reference(c => c.User1).LoadAsync();
        await _context.Entry(chat).Reference(c => c.User2).LoadAsync();

        var newDto = new
        {
            chat.Id,
            chat.User1Id,
            chat.User2Id,
            chat.CreatedAt,
            OtherUser = chat.User1Id == currentUserId ? chat.User2 : chat.User1,
            LastMessage = (object?)null,
            UnreadCount = 0
        };

        return CreatedAtAction(nameof(GetChat), new { id = chat.Id }, newDto);
    }

    // GET /api/chats - Listar mis chats
    [Authorize]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetMyChats()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chats = await _context.Chats
            .Where(c => c.User1Id == currentUserId || c.User2Id == currentUserId)
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .ToListAsync();

        var result = chats.Select(c =>
        {
            var otherUserId = c.User1Id == currentUserId ? c.User2Id : c.User1Id;

            // Check if mutual follow
            var isMutual = _context.Followers.Any(f => f.FollowerId == currentUserId && f.FollowingId == otherUserId)
                        && _context.Followers.Any(f => f.FollowerId == otherUserId && f.FollowingId == currentUserId);

            return new
            {
                c.Id,
                c.User1Id,
                c.User2Id,
                c.CreatedAt,
                OtherUser = c.User1Id == currentUserId ? c.User2 : c.User1,
                LastMessage = c.Messages.OrderByDescending(m => m.CreatedAt).FirstOrDefault(),
                UnreadCount = c.Messages.Count(m => m.SenderId != currentUserId && !m.IsRead),
                IsMutual = isMutual
            };
        })
        .OrderByDescending(c => c.LastMessage != null ? c.LastMessage.CreatedAt : c.CreatedAt)
        .ToList();

        return Ok(result);
    }

    // GET /api/chats/{id} - Obtener un chat específico
    [Authorize]
    [HttpGet("{id}")]
    public async Task<ActionResult<Chat>> GetChat(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats
            .Include(c => c.User1)
            .Include(c => c.User2)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (chat == null)
            return NotFound();

        // Verificar que el usuario pertenece al chat
        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        return Ok(chat);
    }

    // POST /api/chats/{chatId}/messages - Enviar mensaje
    [Authorize]
    [HttpPost("{chatId}/messages")]
    public async Task<ActionResult<Message>> SendMessage(int chatId, [FromBody] CreateMessageDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null)
            return NotFound("Chat not found");

        // Verificar que el usuario pertenece al chat
        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        var content = (dto.Content ?? string.Empty).Trim();
        var mediaUrl = string.IsNullOrWhiteSpace(dto.MediaUrl) ? null : dto.MediaUrl.Trim();

        if (string.IsNullOrWhiteSpace(content) && mediaUrl == null)
            return BadRequest("Content or mediaUrl is required");

        if (mediaUrl != null)
        {
            if (!Uri.TryCreate(mediaUrl, UriKind.Absolute, out var uri)
                || !(string.Equals(uri.Scheme, "http", StringComparison.OrdinalIgnoreCase)
                     || string.Equals(uri.Scheme, "https", StringComparison.OrdinalIgnoreCase))
                || !string.Equals(uri.Host, "media.twittetec.com", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Invalid mediaUrl");
            }
        }

        var message = new Message
        {
            ChatId = chatId,
            SenderId = currentUserId,
            Content = content,
            MediaUrl = mediaUrl,
            IsRead = false
        };

        _context.Messages.Add(message);

        // Guardar mensaje primero para obtener el ID
        await _context.SaveChangesAsync();

        // Determinar el destinatario (el otro usuario en el chat)
        var recipientId = chat.User1Id == currentUserId ? chat.User2Id : chat.User1Id;

        // Cargar sender para SignalR
        await _context.Entry(message).Reference(m => m.Sender).LoadAsync();

        // Enviar mensaje por SignalR al destinatario
        await _hubContext.Clients.Group($"user_{recipientId}")
            .SendAsync("ReceiveMessage", new
            {
                message.Id,
                message.ChatId,
                message.SenderId,
                message.Sender,
                message.Content,
                message.MediaUrl,
                message.IsRead,
                message.CreatedAt
            });

        // Enviar notificación usando NotificationService (incluye push)
        await _notificationService.SendNotificationAsync(
            targetUserId: recipientId,
            actorId: currentUserId,
            type: NotificationType.Message,
            messageId: message.Id
        );

        // También notificar sobre actualización de la lista de chats
        await _hubContext.Clients.Group($"user_{recipientId}")
            .SendAsync("ChatUpdated", chatId);

        // Y al remitente (por ejemplo, múltiples pestañas/dispositivos)
        await _hubContext.Clients.Group($"user_{currentUserId}")
            .SendAsync("ChatUpdated", chatId);

        return CreatedAtAction(nameof(GetMessage), new { chatId, messageId = message.Id }, message);
    }

    // GET /api/chats/{chatId}/messages - Ver mensajes de un chat
    [Authorize]
    [HttpGet("{chatId}/messages")]
    public async Task<ActionResult<object>> GetMessages(int chatId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null)
            return NotFound("Chat not found");

        // Verificar que el usuario pertenece al chat
        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        var messages = await _context.Messages
            .Where(m => m.ChatId == chatId)
            .Include(m => m.Sender)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        // Marcar como leídos los mensajes que no son míos
        var unreadMessages = messages.Where(m => m.SenderId != currentUserId && !m.IsRead).ToList();
        var markedAsReadCount = unreadMessages.Count;

        foreach (var message in unreadMessages)
        {
            message.IsRead = true;
        }

        if (unreadMessages.Any())
        {
            await _context.SaveChangesAsync();

            // Actualizar la lista de chats del usuario actual (unreadCount cambia)
            await _hubContext.Clients.Group($"user_{currentUserId}")
                .SendAsync("ChatUpdated", chatId);
        }

        return Ok(new
        {
            Messages = messages,
            MarkedAsReadCount = markedAsReadCount
        });
    }

    // GET /api/chats/{chatId}/messages/{messageId} - Obtener un mensaje específico
    [Authorize]
    [HttpGet("{chatId}/messages/{messageId}")]
    public async Task<ActionResult<Message>> GetMessage(int chatId, int messageId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null)
            return NotFound("Chat not found");

        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        var message = await _context.Messages
            .Include(m => m.Sender)
            .FirstOrDefaultAsync(m => m.Id == messageId && m.ChatId == chatId);

        if (message == null)
            return NotFound();

        return Ok(message);
    }

    // PATCH /api/chats/{chatId}/messages/{messageId}/read - Marcar mensaje como leído
    [Authorize]
    [HttpPatch("{chatId}/messages/{messageId}/read")]
    public async Task<IActionResult> MarkAsRead(int chatId, int messageId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null)
            return NotFound("Chat not found");

        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        var message = await _context.Messages.FindAsync(messageId);
        if (message == null || message.ChatId != chatId)
            return NotFound("Message not found");

        // Solo puedes marcar como leído mensajes que no enviaste tú
        if (message.SenderId == currentUserId)
            return BadRequest("Cannot mark your own message as read");

        message.IsRead = true;
        await _context.SaveChangesAsync();

        // Refrescar lista de chats para este usuario (unreadCount cambia)
        await _hubContext.Clients.Group($"user_{currentUserId}")
            .SendAsync("ChatUpdated", chatId);

        return NoContent();
    }

    // DELETE /api/chats/{id} - Eliminar chat
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChat(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats.FindAsync(id);
        if (chat == null)
            return NotFound();

        // Verificar que el usuario pertenece al chat
        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        _context.Chats.Remove(chat);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpDelete("{chatId}/messages/{messageId}")]
    public async Task<IActionResult> DeleteMessage(int chatId, int messageId)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null)
            return NotFound("Chat not found");

        if (chat.User1Id != currentUserId && chat.User2Id != currentUserId)
            return Forbid();

        var message = await _context.Messages.FindAsync(messageId);
        if (message == null || message.ChatId != chatId)
            return NotFound("Message not found");

        // Solo puedes eliminar mensajes que enviaste tú
        if (message.SenderId != currentUserId)
            return Forbid();

        _context.Messages.Remove(message);
        await _context.SaveChangesAsync();

        // Determinar el destinatario
        var recipientId = chat.User1Id == currentUserId ? chat.User2Id : chat.User1Id;

        // Notificar por SignalR al otro usuario que se eliminó un mensaje
        await _hubContext.Clients.Group($"user_{recipientId}")
            .SendAsync("MessageDeleted", new { chatId, messageId });

        // También notificar al usuario actual en caso de tener múltiples pestañas abiertas
        await _hubContext.Clients.Group($"user_{currentUserId}")
            .SendAsync("MessageDeleted", new { chatId, messageId });

        // Refrescar lista de chats para ambos (puede cambiar lastMessage/orden)
        await _hubContext.Clients.Group($"user_{recipientId}")
            .SendAsync("ChatUpdated", chatId);
        await _hubContext.Clients.Group($"user_{currentUserId}")
            .SendAsync("ChatUpdated", chatId);

        return NoContent();
    }
}