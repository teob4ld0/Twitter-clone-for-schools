using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Google.Apis.Auth;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using MyNetApp.Data;
using MyNetApp.DTOs;
using MyNetApp.Models;
using MyNetApp.Services;

namespace MyNetApp.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly EmailService _emailService;
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _httpClientFactory;

    public AuthController(AppDbContext context, TokenService tokenService, EmailService emailService, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    private static string? GetCookie(HttpRequest request, string name)
        => request.Cookies.TryGetValue(name, out var value) ? value : null;

    private IActionResult MissingConfig(params string[] keys)
        => StatusCode(500, new { error = "Faltan configuraciones requeridas", missing = keys });

    private sealed class GoogleTokenResponse
    {
        [JsonPropertyName("access_token")] public string? AccessToken { get; set; }
        [JsonPropertyName("id_token")] public string? IdToken { get; set; }
        [JsonPropertyName("refresh_token")] public string? RefreshToken { get; set; }
        [JsonPropertyName("expires_in")] public int? ExpiresIn { get; set; }
        [JsonPropertyName("token_type")] public string? TokenType { get; set; }
        [JsonPropertyName("scope")] public string? Scope { get; set; }
    }

    private async Task<(bool ok, int statusCode, string? error, User? user)> CreateUserFromRegisterAsync(RegisterDto dto, string? profilePictureUrl = null)
    {
        if (dto == null)
            return (false, StatusCodes.Status400BadRequest, "Body inválido", null);

        var normalizedEmail = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        var username = (dto.Username ?? string.Empty).Trim();
        var password = dto.Password ?? string.Empty;

        if (string.IsNullOrWhiteSpace(username))
            return (false, StatusCodes.Status400BadRequest, "Falta username", null);

        // Validar que el username no contenga espacios
        if (username.Contains(' '))
            return (false, StatusCodes.Status400BadRequest, "El username no puede contener espacios", null);

        // Validar que el username solo contenga caracteres alfanuméricos y guiones bajos
        if (!System.Text.RegularExpressions.Regex.IsMatch(username, @"^[a-zA-Z0-9_]+$"))
            return (false, StatusCodes.Status400BadRequest, "El username solo puede contener letras, números y guiones bajos", null);

        if (string.IsNullOrWhiteSpace(normalizedEmail))
            return (false, StatusCodes.Status400BadRequest, "Falta email", null);

        if (string.IsNullOrWhiteSpace(password))
            return (false, StatusCodes.Status400BadRequest, "Falta password", null);

        var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (existing != null)
            return (false, StatusCodes.Status409Conflict, "Ya existe un usuario con ese email", null);

        // Generar token de verificación
        var verificationToken = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        
        var user = new User
        {
            Username = username,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            ProfilePictureUrl = string.IsNullOrWhiteSpace(profilePictureUrl) ? null : profilePictureUrl,
            EmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddHours(24)
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return (true, StatusCodes.Status200OK, null, user);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var (ok, statusCode, error, user) = await CreateUserFromRegisterAsync(dto);
        if (!ok)
            return StatusCode(statusCode, new { error });

        // Enviar email de verificación solo si el usuario fue creado con contraseña
        if (user != null && !string.IsNullOrWhiteSpace(user.EmailVerificationToken))
        {
            try
            {
                // Sincronizar contacto con Brevo CRM
                await _emailService.SyncContactAsync(
                    user.Email, 
                    user.Username,
                    new Dictionary<string, object>
                    {
                        { "EMAIL_VERIFICADO", false },
                        { "ORIGEN_REGISTRO", "manual" }
                    }
                );

                // Enviar email de verificación
                await _emailService.SendVerificationEmailAsync(
                    user.Email,
                    user.Username,
                    user.EmailVerificationToken,
                    user.Id
                );
            }
            catch (Exception ex)
            {
                // Log error pero no fallar el registro
                Console.WriteLine($"Error enviando email de verificación: {ex.Message}");
            }
        }

        return Ok(new { message = "Registro exitoso. Por favor verifica tu email." });
    }

    [HttpPost("login")]
    public IActionResult Login(LoginDto dto)
    {
        var user = _context.Users.SingleOrDefault(u => u.Email == dto.Email);
        if (user == null)
            return Unauthorized();

        // If the user was created via Google login, they may not have a usable password.
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
            return Unauthorized(new { error = "Este usuario no tiene contraseña. Inicia sesión con Google." });

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized();

        // Verificar que el email esté confirmado
        if (!user.EmailVerified)
            return Unauthorized(new { error = "Por favor verifica tu email antes de iniciar sesión." });

        // Verificar que el usuario no esté baneado
        if (user.Banned)
            return Unauthorized(new { error = "Tu cuenta ha sido suspendida. Contacta al administrador." });

        var token = _tokenService.CreateToken(user);
        return Ok(new { token });
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin(GoogleLoginDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.IdToken))
            return BadRequest(new { error = "Falta idToken" });

        var clientId = _config["GoogleAuth:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            return StatusCode(500, new { error = "GoogleAuth:ClientId no está configurado" });

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                dto.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                }
            );
        }
        catch
        {
            return Unauthorized(new { error = "Token de Google inválido" });
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
            return Unauthorized(new { error = "El token de Google no contiene email" });

        // Optional allowlist by email domain.
        var allowedDomains = _config.GetSection("GoogleAuth:AllowedEmailDomains").Get<string[]>() ?? Array.Empty<string>();
        if (allowedDomains.Length > 0)
        {
            var emailDomain = payload.Email.Split('@').LastOrDefault()?.ToLowerInvariant();
            var domainAllowed = !string.IsNullOrWhiteSpace(emailDomain) && allowedDomains.Any(d => string.Equals(d?.TrimStart('@'), emailDomain, StringComparison.OrdinalIgnoreCase));
            if (!domainAllowed)
                return Unauthorized(new { error = "Email no permitido" });
        }

        var normalizedEmail = payload.Email.Trim().ToLowerInvariant();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            var username = !string.IsNullOrWhiteSpace(payload.Name)
                ? payload.Name
                : normalizedEmail.Split('@')[0];

            // Create a random password hash so password-login isn't possible unless you add a "set password" flow later.
            var randomPassword = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

            user = new User
            {
                Username = username,
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(randomPassword),
                ProfilePictureUrl = payload.Picture,
                EmailVerified = true // Los usuarios de Google están automáticamente verificados
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Sincronizar contacto de Google con Brevo CRM
            try
            {
                await _emailService.SyncContactAsync(
                    user.Email,
                    user.Username,
                    new Dictionary<string, object>
                    {
                        { "EMAIL_VERIFICADO", true },
                        { "ORIGEN_REGISTRO", "google" },
                        { "FOTO_PERFIL", payload.Picture ?? "" }
                    }
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sincronizando contacto de Google: {ex.Message}");
            }
        }
        else
        {
            // Keep profile picture in sync (optional, but nice UX).
            if (!string.IsNullOrWhiteSpace(payload.Picture) && user.ProfilePictureUrl != payload.Picture)
                user.ProfilePictureUrl = payload.Picture;

            await _context.SaveChangesAsync();
        }

        // Verificar que el usuario no esté baneado
        if (user.Banned)
            return Unauthorized(new { error = "Tu cuenta ha sido suspendida. Contacta al administrador." });

        var token = _tokenService.CreateToken(user);
        return Ok(new { token });
    }

    // Authorization Code flow (redirect/callback)
    [HttpGet("google/start")]
    public IActionResult GoogleStart()
    {
        var clientId = _config["GoogleAuth:ClientId"];
        var redirectUri = _config["GoogleAuth:RedirectUri"];

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(clientId)) missing.Add("GoogleAuth:ClientId");
        if (string.IsNullOrWhiteSpace(redirectUri)) missing.Add("GoogleAuth:RedirectUri");
        if (missing.Count > 0)
            return MissingConfig(missing.ToArray());

        var safeClientId = clientId!;
        var safeRedirectUri = redirectUri!;

        var state = Guid.NewGuid().ToString("N");

        // OAuth redirects originate from a different site (accounts.google.com -> our site).
        // Use SameSite=None on HTTPS so the cookie is reliably included in the callback.
        var isHttps = Request.IsHttps;
        Response.Cookies.Append(
            "google_oauth_state",
            state,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = isHttps,
                SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddMinutes(10)
            }
        );

        var url = "https://accounts.google.com/o/oauth2/v2/auth"
            + "?client_id=" + Uri.EscapeDataString(safeClientId)
            + "&redirect_uri=" + Uri.EscapeDataString(safeRedirectUri)
            + "&response_type=code"
            + "&scope=" + Uri.EscapeDataString("openid email profile")
            + "&include_granted_scopes=true"
            + "&state=" + Uri.EscapeDataString(state)
            + "&prompt=consent";

        return Redirect(url);
    }

    // Browser callback (Google redirects with GET)
    [HttpGet("google/exchange")]
    public async Task<IActionResult> GoogleExchangeCodeGet([FromQuery(Name = "code")] string? code, [FromQuery(Name = "state")] string? state)
        => await ExchangeGoogleCodeAsync(code, state);

    // Mobile app POST endpoint (returns JSON)
    [HttpPost("google/exchange")]
    public async Task<IActionResult> GoogleExchangeCodePost([FromBody] GoogleCodeExchangeDto dto)
    {
        if (dto == null)
            return BadRequest(new { error = "Falta información" });
        
        return await ExchangeGoogleCodeAsync(dto.Code, dto.State, dto);
    }

    private async Task<IActionResult> ExchangeGoogleCodeAsync(string? code, string? state)
    {
        return await ExchangeGoogleCodeAsync(code, state, null);
    }

    private async Task<IActionResult> ExchangeGoogleCodeAsync(string? code, string? state, GoogleCodeExchangeDto? userProvided)
    {
        if (string.IsNullOrWhiteSpace(code))
            return BadRequest(new { error = "Falta code" });

        var clientId = _config["GoogleAuth:ClientId"];
        var clientSecret = _config["GoogleAuth:ClientSecret"];
        var redirectUri = _config["GoogleAuth:RedirectUri"];

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(clientId)) missing.Add("GoogleAuth:ClientId");
        if (string.IsNullOrWhiteSpace(clientSecret)) missing.Add("GoogleAuth:ClientSecret");
        if (string.IsNullOrWhiteSpace(redirectUri)) missing.Add("GoogleAuth:RedirectUri");
        if (missing.Count > 0)
            return MissingConfig(missing.ToArray());

        var safeClientId = clientId!;
        var safeClientSecret = clientSecret!;
        var safeRedirectUri = redirectUri!;

        // Detect mobile flow: if state starts with "mobile:", skip cookie validation
        var isMobileFlow = !string.IsNullOrWhiteSpace(state) && state.StartsWith("mobile:", StringComparison.Ordinal);
        
        if (!isMobileFlow)
        {
            // Web flow: validate state against cookie
            var expectedState = GetCookie(Request, "google_oauth_state");
            if (string.IsNullOrWhiteSpace(expectedState))
                return Unauthorized(new
                {
                    error = "Estado inválido",
                    hasCookie = false,
                    hint = "No llegó la cookie de state. Asegurate de iniciar el flujo en el mismo dominio que recibe el callback (ej: si empezás en localhost, el redirectUri también debe ser localhost)."
                });

            if (string.IsNullOrWhiteSpace(state) || !string.Equals(expectedState, state, StringComparison.Ordinal))
                return Unauthorized(new { error = "Estado inválido", hasCookie = true });

            // one-time use
            Response.Cookies.Delete("google_oauth_state");
        }
        else if (string.IsNullOrWhiteSpace(code))
        {
            // Mobile flow: just ensure we have a code
            return BadRequest(new { error = "Falta code" });
        }

        var http = _httpClientFactory.CreateClient();
        using var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["code"] = code,
            ["client_id"] = safeClientId,
            ["client_secret"] = safeClientSecret,
            ["redirect_uri"] = safeRedirectUri,
            ["grant_type"] = "authorization_code"
        });

        using var tokenResponse = await http.PostAsync("https://oauth2.googleapis.com/token", content);
        var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
        if (!tokenResponse.IsSuccessStatusCode)
            return Unauthorized(new { error = "Intercambio de código falló", details = tokenJson });

        var tokenData = JsonSerializer.Deserialize<GoogleTokenResponse>(tokenJson);
        if (tokenData == null || string.IsNullOrWhiteSpace(tokenData.IdToken))
            return Unauthorized(new { error = "Google no devolvió id_token" });

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                tokenData.IdToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                }
            );
        }
        catch
        {
            return Unauthorized(new { error = "id_token inválido" });
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
            return Unauthorized(new { error = "El token de Google no contiene email" });

        var allowedDomains = _config.GetSection("GoogleAuth:AllowedEmailDomains").Get<string[]>() ?? Array.Empty<string>();
        if (allowedDomains.Length > 0)
        {
            var emailDomain = payload.Email.Split('@').LastOrDefault()?.ToLowerInvariant();
            var domainAllowed = !string.IsNullOrWhiteSpace(emailDomain) && allowedDomains.Any(d => string.Equals(d?.Trim().TrimStart('@'), emailDomain, StringComparison.OrdinalIgnoreCase));
            if (!domainAllowed)
                return Unauthorized(new { error = "Email no permitido" });
        }

        var normalizedEmail = payload.Email.Trim().ToLowerInvariant();

        // If client also sent an email, ensure it matches Google's email.
        if (userProvided != null && !string.IsNullOrWhiteSpace(userProvided.Email))
        {
            var providedEmail = userProvided.Email.Trim().ToLowerInvariant();
            if (!string.Equals(providedEmail, normalizedEmail, StringComparison.Ordinal))
                return BadRequest(new { error = "El email provisto no coincide con el email de Google" });
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            var desiredUsername = userProvided != null && !string.IsNullOrWhiteSpace(userProvided.Username)
                ? userProvided.Username.Trim()
                : (!string.IsNullOrWhiteSpace(payload.Name) ? payload.Name : normalizedEmail.Split('@')[0]);

            // Sanitizar username: reemplazar espacios por guiones bajos y remover caracteres inválidos
            desiredUsername = System.Text.RegularExpressions.Regex.Replace(desiredUsername, @"\s+", "_");
            desiredUsername = System.Text.RegularExpressions.Regex.Replace(desiredUsername, @"[^a-zA-Z0-9_]", "");
            
            // Asegurar que el username no esté vacío después de la sanitización
            if (string.IsNullOrWhiteSpace(desiredUsername))
                desiredUsername = "user_" + Guid.NewGuid().ToString("N").Substring(0, 8);

            // If frontend provided a password, create as a normal registered user.
            // Otherwise keep the previous behavior (random password; only Google login usable).
            if (userProvided != null && !string.IsNullOrWhiteSpace(userProvided.Password))
            {
                var (ok, statusCode, error, createdUser) = await CreateUserFromRegisterAsync(
                    new RegisterDto
                    {
                        Username = desiredUsername,
                        Email = normalizedEmail,
                        Password = userProvided.Password
                    },
                    profilePictureUrl: payload.Picture
                );

                if (!ok || createdUser == null)
                    return StatusCode(statusCode, new { error = error ?? "No se pudo crear el usuario" });

                user = createdUser;
            }
            else
            {
                var randomPassword = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                user = new User
                {
                    Username = desiredUsername,
                    Email = normalizedEmail,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(randomPassword),
                    ProfilePictureUrl = payload.Picture,
                    EmailVerified = true // Los usuarios de Google están automáticamente verificados
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Sincronizar contacto de Google con Brevo CRM
                try
                {
                    await _emailService.SyncContactAsync(
                        user.Email,
                        user.Username,
                        new Dictionary<string, object>
                        {
                            { "EMAIL_VERIFICADO", true },
                            { "ORIGEN_REGISTRO", "google" },
                            { "FOTO_PERFIL", payload.Picture ?? "" }
                        }
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error sincronizando contacto de Google: {ex.Message}");
                }
            }
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(payload.Picture) && user.ProfilePictureUrl != payload.Picture)
                user.ProfilePictureUrl = payload.Picture;

            // Allow setting username/password during exchange (useful for "complete registration" UX)
            if (userProvided != null)
            {
                if (!string.IsNullOrWhiteSpace(userProvided.Username) && user.Username != userProvided.Username.Trim())
                    user.Username = userProvided.Username.Trim();

                if (!string.IsNullOrWhiteSpace(userProvided.Password))
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(userProvided.Password);
            }

            await _context.SaveChangesAsync();
        }

        // Verificar que el usuario no esté baneado
        if (user.Banned)
            return Unauthorized(new { error = "Tu cuenta ha sido suspendida. Contacta al administrador." });

        var token = _tokenService.CreateToken(user);

        // If this is the browser callback (GET), redirect to the frontend with token
        if (HttpMethods.IsGet(Request.Method))
        {
            // Check if this is a mobile flow (already determined above)
            if (isMobileFlow)
            {
                // Mobile flow: redirect to app with token
                var mobileScheme = _config["GoogleAuth:MobileScheme"] ?? "mynetapp";
                return Redirect($"{mobileScheme}://auth?token={Uri.EscapeDataString(token)}");
            }
            else
            {
                // Web flow: redirect to web app
                var frontendUrl = _config["GoogleAuth:FrontendUrl"] ?? "https://app.twittetec.com";
                return Redirect($"{frontendUrl}/google/callback#token={Uri.EscapeDataString(token)}");
            }
        }

        return Ok(new { token });
    }

    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token, [FromQuery] string uid)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { error = "Token de verificación requerido" });

        if (string.IsNullOrWhiteSpace(uid))
            return BadRequest(new { error = "Hash de usuario requerido" });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
        
        if (user == null)
            return NotFound(new { error = "Token de verificación inválido" });

        // Validar MD5 del userId
        var expectedHash = GenerateMD5Hash(user.Id.ToString());
        if (!string.Equals(uid, expectedHash, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Hash de usuario inválido" });

        if (user.EmailVerified)
            return Ok(new { message = "El email ya ha sido verificado anteriormente" });

        if (user.EmailVerificationTokenExpiry == null || user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            return BadRequest(new { error = "El token de verificación ha expirado" });

        user.EmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;

        await _context.SaveChangesAsync();

        // Actualizar contacto en Brevo CRM y enviar email de bienvenida
        try
        {
            await _emailService.SyncContactAsync(
                user.Email, 
                user.Username,
                new Dictionary<string, object>
                {
                    { "EMAIL_VERIFICADO", true },
                    { "FECHA_VERIFICACION", DateTime.UtcNow.ToString("yyyy-MM-dd") }
                }
            );

            await _emailService.SendWelcomeEmailAsync(user.Email, user.Username);
        }
        catch (Exception ex)
        {
            // Log error pero no fallar la verificación
            Console.WriteLine($"Error enviando email de bienvenida: {ex.Message}");
        }

        return Ok(new { message = "Email verificado exitosamente. Ya puedes iniciar sesión." });
    }

    private string GenerateMD5Hash(string input)
    {
        using (var md5 = System.Security.Cryptography.MD5.Create())
        {
            var inputBytes = System.Text.Encoding.UTF8.GetBytes(input);
            var hashBytes = md5.ComputeHash(inputBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }
    }
}
