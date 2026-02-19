using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Attributes;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportController(AppDbContext context)
    {
        _context = context;
    }

    // POST /api/reports - Crear un reporte (cualquier usuario autenticado)
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Debe proveer exactamente uno de los dos: StatusId o OtherUserId
        if (dto.StatusId == null && dto.OtherUserId == null)
            return BadRequest(new { message = "Debe indicar un status o un usuario a reportar." });

        if (dto.StatusId != null && dto.OtherUserId != null)
            return BadRequest(new { message = "Solo se puede reportar un status o un usuario a la vez, no ambos." });

        // No puedes reportarte a ti mismo
        if (dto.OtherUserId == currentUserId)
            return BadRequest(new { message = "No puedes reportarte a ti mismo." });

        // Validar que el status existe (si aplica)
        if (dto.StatusId != null)
        {
            var statusExists = await _context.Statuses.AnyAsync(s => s.Id == dto.StatusId);
            if (!statusExists)
                return NotFound(new { message = "El status indicado no existe." });
        }

        // Validar que el usuario reportado existe (si aplica)
        if (dto.OtherUserId != null)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Id == dto.OtherUserId);
            if (!userExists)
                return NotFound(new { message = "El usuario indicado no existe." });
        }

        var report = new Report
        {
            UserId     = currentUserId,
            StatusId   = dto.StatusId,
            OtherUserId = dto.OtherUserId,
            Type       = dto.Type
        };

        _context.Reports.Add(report);
        await _context.SaveChangesAsync();

        return Created($"/api/reports/{report.Id}", new
        {
            report.Id,
            report.CreatedAt,
            report.UserId,
            report.StatusId,
            report.OtherUserId,
            Type = report.Type.ToString()
        });
    }

    // GET /api/reports - Obtener todos los reportes (solo admin)
    [RequireAdmin]
    [HttpGet]
    public async Task<IActionResult> GetAllReports(
        [FromQuery] ReportReason? type = null,
        [FromQuery] int? reportedUserId = null,
        [FromQuery] int? reporterUserId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 50;

        var query = _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.OtherUser)
            .Include(r => r.Status)
            .AsQueryable();

        if (type != null)
            query = query.Where(r => r.Type == type);

        if (reportedUserId != null)
            query = query.Where(r => r.OtherUserId == reportedUserId);

        if (reporterUserId != null)
            query = query.Where(r => r.UserId == reporterUserId);

        var total = await query.CountAsync();

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new
            {
                r.Id,
                r.CreatedAt,
                Reporter = new { r.Reporter.Id, r.Reporter.Username, r.Reporter.Email },
                r.StatusId,
                StatusContent = r.Status != null ? r.Status.Content : null,
                ReportedUser = r.OtherUser != null
                    ? new { r.OtherUser.Id, r.OtherUser.Username, r.OtherUser.Email }
                    : (object?)null,
                Type = r.Type.ToString(),
                TypeId = (int)r.Type
            })
            .ToListAsync();

        return Ok(new
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            Data = reports
        });
    }

    // GET /api/reports/{id} - Obtener un reporte específico (solo admin)
    [RequireAdmin]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetReport(int id)
    {
        var report = await _context.Reports
            .Include(r => r.Reporter)
            .Include(r => r.OtherUser)
            .Include(r => r.Status)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (report == null)
            return NotFound(new { message = "Reporte no encontrado." });

        return Ok(new
        {
            report.Id,
            report.CreatedAt,
            Reporter = new { report.Reporter.Id, report.Reporter.Username, report.Reporter.Email },
            report.StatusId,
            StatusContent = report.Status?.Content,
            ReportedUser = report.OtherUser != null
                ? new { report.OtherUser.Id, report.OtherUser.Username, report.OtherUser.Email }
                : (object?)null,
            Type = report.Type.ToString(),
            TypeId = (int)report.Type
        });
    }
}
