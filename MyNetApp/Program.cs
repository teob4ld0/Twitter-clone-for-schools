using MyNetApp;
using MyNetApp.Models;
using MyNetApp.Services;
using MyNetApp.Data;
using MyNetApp.Hubs;
using MyNetApp.Middleware;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Upload limits (multipart/form-data). Useful for videos (.mp4).
builder.Services.Configure<FormOptions>(options =>
{
    // 200 MB
    options.MultipartBodyLengthLimit = 200L * 1024 * 1024;
});

builder.WebHost.ConfigureKestrel(options =>
{
    // 200 MB
    options.Limits.MaxRequestBodySize = 200L * 1024 * 1024;
});


//controllers' configuration with JSON options
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Rechazar propiedades adicionales no definidas en el DTO
        options.JsonSerializerOptions.AllowTrailingCommas = false;
        options.JsonSerializerOptions.UnmappedMemberHandling =
            System.Text.Json.Serialization.JsonUnmappedMemberHandling.Skip;

        // Configurar para ignorar ciclos de referencia
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;

        // Usar camelCase para las propiedades JSON (compatible con JavaScript)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection")
        )
    );
});

// JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new()
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            )
        };

        // Configurar para que SignalR pueda usar el token JWT
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs/chat") || path.StartsWithSegments("/hubs/notifications")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    }
);

//Services
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<WebPushService>();
builder.Services.AddScoped<ExpoPushService>();
builder.Services.AddHttpClient();
builder.Services.Configure<GoogleCloudStorageOptions>(
    builder.Configuration.GetSection("GoogleCloudStorage")
);
builder.Services.AddSingleton<IMediaStorage, GoogleCloudBuckets>();

// SignalR
builder.Services.AddSignalR();

// CORS Configuration
builder.Services.AddCors(options => {
    options.AddPolicy("CORSPolicy",
        builder => builder
        .AllowCredentials()
        .AllowAnyMethod()
        .AllowAnyHeader()
        .SetIsOriginAllowed((hosts) => true));
});

// If running behind a reverse proxy (Ingress/Nginx/ALB), trust forwarded headers so
// redirects, generated URLs and SignalR negotiate the correct scheme (https/wss).
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});
 

var app = builder.Build();

app.UseForwardedHeaders();

// Apply migrations automatically on startup (skip during EF design-time operations)
var isEfDesignTime = string.Equals(Environment.GetEnvironmentVariable("EFCORE_DESIGNTIME"), "true", StringComparison.OrdinalIgnoreCase)
    || Environment.GetEnvironmentVariable("EFCORE_DESIGNTIME") == "1";
var applyMigrationsOnStartup = builder.Configuration.GetValue<bool>("ApplyMigrationsOnStartup", true);

if (applyMigrationsOnStartup && !isEfDesignTime)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
}

app.UseCors("CORSPolicy");
app.UseRouting();
 
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<BannedUserMiddleware>();
app.UseAuthorization();

app.MapControllers();

// Root endpoint for GKE Ingress health checks
app.MapGet("/", () => Results.Ok(new { status = "ok", service = "twittetec-backend", version = "0.0.81" }));

// Health check endpoint for diagnostics
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapHub<ChatHub>("/hubs/chat");
app.MapHub<NotificationHub>("/hubs/notifications");

app.Run();