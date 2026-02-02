namespace MyNetApp.DTOs;

public class CreateStatusDto
{
    public string Content { get; set; } = null!;

    // Optional media URL obtained from /api/media/upload
    public string? MediaUrl { get; set; }

    // If set, this status is a reply to another status.
    public int? ParentStatusId { get; set; }

    // If set, this status is a quote of another status.
    public int? QuotedStatusId { get; set; }
}
