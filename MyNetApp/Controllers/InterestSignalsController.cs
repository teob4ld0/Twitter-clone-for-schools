using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using System.Security.Claims;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterestSignalsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<InterestSignalsController> _logger;

    public InterestSignalsController(AppDbContext context, ILogger<InterestSignalsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // POST api/interestsignals
    [HttpPost]
    public async Task<IActionResult> RecordSignal([FromBody] RecordInterestSignalDto dto)
    {
        _logger.LogInformation("=== INICIO RecordSignal ===");
        _logger.LogInformation("Received DTO: StatusId={StatusId}, SignalType={SignalType}, Value={Value}, Metadata={Metadata}", 
            dto?.StatusId, dto?.SignalType, dto?.Value, dto?.Metadata);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("ModelState inválido:");
            foreach (var error in ModelState)
            {
                _logger.LogWarning("Key: {Key}, Errors: {Errors}", error.Key, string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage)));
            }
            return BadRequest(ModelState);
        }

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("UserIdStr from claims: {UserIdStr}", userIdStr);
        
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            _logger.LogWarning("Usuario no autenticado o userId inválido");
            return Unauthorized(new { message = "Usuario no autenticado" });
        }

        _logger.LogInformation("UserId parsed: {UserId}", userId);

        // Validar que el status existe (solo si se proporciona StatusId)
        if (dto.StatusId.HasValue)
        {
            var statusExists = await _context.Statuses.AnyAsync(s => s.Id == dto.StatusId.Value);
            _logger.LogInformation("Status exists check: StatusId={StatusId}, Exists={Exists}", dto.StatusId, statusExists);
            
            if (!statusExists)
            {
                _logger.LogWarning("Status no encontrado: {StatusId}", dto.StatusId);
                return NotFound(new { message = "Status no encontrado" });
            }
        }
        else
        {
            // Para señales sin status (follow/unfollow/opening_user_profile), validar que el tipo lo permite
            if (dto.SignalType != "follow" && dto.SignalType != "unfollow" && dto.SignalType != "opening_user_profile")
            {
                _logger.LogWarning("StatusId es requerido para el tipo de señal: {SignalType}", dto.SignalType);
                return BadRequest(new { message = "StatusId es requerido para este tipo de señal" });
            }
            _logger.LogInformation("Señal sin StatusId (tipo: {SignalType})", dto.SignalType);
        }


        // Validar tipo de señal
        var validSignalTypes = new[] { "view_time", "scroll_pause", "click", "like", "repost", "mention_click", "reply", "quote", "follow", "unfollow", "opening_user_profile" };
        _logger.LogInformation("Validating signal type: {SignalType}, IsValid={IsValid}", 
            dto.SignalType, validSignalTypes.Contains(dto.SignalType));
        
        if (!validSignalTypes.Contains(dto.SignalType))
        {
            _logger.LogWarning("Tipo de señal inválido: {SignalType}", dto.SignalType);
            return BadRequest(new { message = "Tipo de señal inválido" });
        }

        // Validar valor (para view_time debe ser positivo y razonable)
        if (dto.SignalType == "view_time" && (dto.Value < 0 || dto.Value > 120000)) // Max 2 minutos
        {
            _logger.LogWarning("Valor de tiempo inválido: {Value}", dto.Value);
            return BadRequest(new { message = "Valor de tiempo inválido" });
        }

        // Para likes, reposts, mention_click, replies, quotes, follow, unfollow y opening_user_profile, el valor debe ser 1
        if ((dto.SignalType == "like" || dto.SignalType == "repost" || dto.SignalType == "mention_click" || dto.SignalType == "reply" || dto.SignalType == "quote" || dto.SignalType == "follow" || dto.SignalType == "unfollow" || dto.SignalType == "opening_user_profile") && dto.Value != 1)
        {
            _logger.LogWarning("Valor incorrecto para {SignalType}: {Value} (esperado 1)", dto.SignalType, dto.Value);
            return BadRequest(new { message = $"Valor de {dto.SignalType} debe ser 1" });
        }

        _logger.LogInformation("Todas las validaciones pasaron, intentando guardar...");

        try
        {
            var signal = new InterestSignal
            {
                UserId = userId,
                StatusId = dto.StatusId, // Null para señales sin status asociado (follow/unfollow)
                SignalType = dto.SignalType,
                Value = dto.Value,
                Metadata = dto.Metadata,
                CreatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Creando señal: UserId={UserId}, StatusId={StatusId}, Type={Type}, Value={Value}", 
                signal.UserId, signal.StatusId, signal.SignalType, signal.Value);

            _context.InterestSignals.Add(signal);
            var saveResult = await _context.SaveChangesAsync();
            
            _logger.LogInformation("SaveChanges result: {SaveResult} registros guardados", saveResult);
            _logger.LogInformation("✅ Interest signal recorded: User={UserId}, Status={StatusId}, Type={SignalType}, Value={Value}",
                userId, dto.StatusId, dto.SignalType, dto.Value);

            return Ok(new { 
                message = "Señal registrada correctamente",
                signalId = signal.Id 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error recording interest signal: {Message}, StackTrace: {StackTrace}", 
                ex.Message, ex.StackTrace);
            return StatusCode(500, new { message = "Error al registrar la señal", details = ex.Message });
        }
    }

    // GET api/interestsignals/status/{statusId}/analytics
    [HttpGet("status/{statusId}/analytics")]
    public async Task<IActionResult> GetStatusAnalytics(int statusId)
    {
        var statusExists = await _context.Statuses.AnyAsync(s => s.Id == statusId);
        if (!statusExists)
        {
            return NotFound(new { message = "Status no encontrado" });
        }

        var signals = await _context.InterestSignals
            .Where(i => i.StatusId == statusId)
            .GroupBy(i => i.SignalType)
            .Select(g => new
            {
                SignalType = g.Key,
                Count = g.Count(),
                AverageValue = g.Average(i => i.Value),
                TotalValue = g.Sum(i => i.Value)
            })
            .ToListAsync();

        return Ok(signals);
    }
}
