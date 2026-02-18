using MyNetApp.Models;

namespace MyNetApp.DTOs;

public class CreateReportDto
{
    // Solo uno de los dos debe ser provisto (Status o User)
    public int? StatusId { get; set; }
    public int? OtherUserId { get; set; }

    public ReportReason Type { get; set; }
}
