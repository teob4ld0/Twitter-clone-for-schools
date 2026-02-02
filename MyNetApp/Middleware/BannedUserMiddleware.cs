using MyNetApp.Data;
using System.Security.Claims;

namespace MyNetApp.Middleware;

public class BannedUserMiddleware
{
    private readonly RequestDelegate _next;

    public BannedUserMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        // Solo verificar si el usuario está autenticado
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var userId))
            {
                var user = await dbContext.Users.FindAsync(userId);
                if (user != null && user.Banned)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync("{\"message\":\"Tu cuenta ha sido suspendida. Contacta al administrador.\",\"banned\":true}");
                    return;
                }
            }
        }

        await _next(context);
    }
}
