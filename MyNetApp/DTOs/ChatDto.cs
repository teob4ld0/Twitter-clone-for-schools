namespace MyNetApp.DTOs;

public record ChatDto(
    int Id,
    int User1Id,
    int User2Id,
    DateTime CreatedAt,
    UserDto? OtherUser,
    MessageDto? LastMessage,
    int UnreadCount
);

public record UserDto(
    int Id,
    string UserName,
    string Email
);

public record MessageDto(
    int Id,
    int ChatId,
    int SenderId,
    string Content,
    bool IsRead,
    DateTime CreatedAt,
    UserDto Sender
);
