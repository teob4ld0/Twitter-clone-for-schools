using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MyNetApp.Services;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly IMediaStorage _mediaStorage;
    private readonly ILogger<MediaController> _logger;

    public MediaController(IMediaStorage mediaStorage, ILogger<MediaController> logger)
    {
        _mediaStorage = mediaStorage;
        _logger = logger;
    }

    /// <summary>
    /// Upload media to Google Cloud Storage.
    /// Expects multipart/form-data with a file field named "file".
    /// </summary>
    [Authorize]
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(200L * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200L * 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? prefix = null, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("=== INICIO UPLOAD - Recibiendo archivo ===");
            
            if (file is null)
            {
                _logger.LogWarning("Upload fallido: file es null");
                return BadRequest("file is required");
            }

            if (file.Length <= 0)
            {
                _logger.LogWarning("Upload fallido: file está vacío");
                return BadRequest("file is empty");
            }

            _logger.LogInformation("Archivo recibido: {FileName}, Tamaño: {Size} bytes, ContentType: {ContentType}", 
                file.FileName, file.Length, file.ContentType);

            _logger.LogInformation("Iniciando subida a Google Cloud Storage...");
            var result = await _mediaStorage.UploadAsync(file, prefix, ct);
            
            _logger.LogInformation("=== UPLOAD EXITOSO - Archivo subido: {Url} ===", result.PublicUrl);

            return Created(result.PublicUrl, new
            {
                result.Bucket,
                result.ObjectName,
                result.PublicUrl,
                result.ContentType,
                result.Size
            });
        }
        
        catch (Exception ex)
        {
            _logger.LogError(ex, "=== ERROR EN UPLOAD - Tipo: {ExceptionType}, Mensaje: {Message} ===", 
                ex.GetType().Name, ex.Message);
            return StatusCode(500, ex);
        }
    }

    /// <summary>
    /// Delete an object by its objectName (path inside the bucket).
    /// </summary>
    [Authorize]
    [HttpDelete]
    public async Task<IActionResult> Delete([FromQuery] string objectName, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(objectName))
            return BadRequest("objectName is required");

        try
        {
            await _mediaStorage.DeleteAsync(objectName, ct);
            return NoContent();
        }
        catch (MediaStorageForbiddenException ex)
        {
            _logger.LogWarning(ex, "Media delete forbidden by storage provider. Bucket={Bucket} Object={Object}", ex.BucketName, ex.ObjectName);
            return StatusCode(403, new
            {
                error = ex.Message,
                bucket = ex.BucketName,
                objectName = ex.ObjectName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error deleting media");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
