using Microsoft.AspNetCore.Mvc;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DownloadController : ControllerBase
{
    [HttpGet("apk")]
    public IActionResult GetApk()
    {
        var apkPath = Path.Combine(Directory.GetCurrentDirectory(), "downloads", "Twittetec.apk");
        
        if (!System.IO.File.Exists(apkPath))
        {
            return NotFound(new { error = "APK no encontrado" });
        }

        var apkBytes = System.IO.File.ReadAllBytes(apkPath);
        
        Response.Headers.Append("Content-Disposition", "attachment; filename=\"Twittetec.apk\"");
        Response.Headers.Append("Access-Control-Allow-Origin", "*");
        
        return File(apkBytes, "application/vnd.android.package-archive", "Twittetec.apk");
    }

    [HttpGet("info")]
    public IActionResult GetApkInfo()
    {
        var apkPath = Path.Combine(Directory.GetCurrentDirectory(), "downloads", "Twittetec.apk");
        
        if (!System.IO.File.Exists(apkPath))
        {
            return NotFound(new { available = false });
        }

        var apkInfo = new FileInfo(apkPath);
        
        return Ok(new 
        { 
            available = true,
            fileName = "Twittetec.apk",
            sizeBytes = apkInfo.Length,
            sizeMB = Math.Round(apkInfo.Length / (1024.0 * 1024.0), 2),
            lastModified = apkInfo.LastWriteTimeUtc
        });
    }
}
