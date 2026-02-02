using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace MyNetApp.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireAdminAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // Verificar que el usuario esté autenticado
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Unauthorized" });
            return;
        }

        // Obtener el email del usuario
        var emailClaim = context.HttpContext.User.FindFirst(ClaimTypes.Email);
        if (emailClaim == null)
        {
            context.Result = new ForbiddenObjectResult(new { message = "Email claim not found" });
            return;
        }

        var email = emailClaim.Value;

        // Verificar que NO sea un email de alumno
        if (email.EndsWith("@alumno.etec.um.edu.ar", StringComparison.OrdinalIgnoreCase))
        {
            context.Result = new ForbiddenObjectResult(new { message = "Access denied: Student accounts cannot access admin features" });
            return;
        }
    }
}

// Atributo para verificar que el usuario no esté baneado
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class CheckBannedAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // Verificar que el usuario esté autenticado
        if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
        {
            return; // Si no está autenticado, dejar que [Authorize] lo maneje
        }

        // Obtener el ID del usuario
        var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            return;
        }

        // Verificar en la base de datos si el usuario está baneado
        var dbContext = context.HttpContext.RequestServices.GetService<Data.AppDbContext>();
        if (dbContext == null)
        {
            return;
        }

        var user = await dbContext.Users.FindAsync(userId);
        if (user != null && user.Banned)
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Tu cuenta ha sido suspendida. Contacta al administrador." });
            return;
        }
    }
}

// Clase auxiliar para el resultado Forbidden (403)
public class ForbiddenObjectResult : ObjectResult
{
    public ForbiddenObjectResult(object value) : base(value)
    {
        StatusCode = StatusCodes.Status403Forbidden;
    }
}
