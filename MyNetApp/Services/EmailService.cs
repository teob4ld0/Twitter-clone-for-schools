using sib_api_v3_sdk.Api;
using sib_api_v3_sdk.Client;
using sib_api_v3_sdk.Model;

namespace MyNetApp.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly TransactionalEmailsApi _apiInstance;
    private readonly ContactsApi _contactsApi;

    public EmailService(IConfiguration config)
    {
        _config = config;
        
        var apiKey = _config["Brevo:ApiKey"];
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            Configuration.Default.ApiKey["api-key"] = apiKey;
            _apiInstance = new TransactionalEmailsApi();
            _contactsApi = new ContactsApi();
        }
        else
        {
            throw new Exception("Brevo API Key no configurada");
        }
    }

    // Sincronizar contacto con Brevo CRM
    public async System.Threading.Tasks.Task SyncContactAsync(string email, string username, Dictionary<string, object>? additionalAttributes = null)
    {
        try
        {
            var attributes = new Dictionary<string, object>
            {
                { "NOMBRE", username },
                { "FECHA_REGISTRO", DateTime.UtcNow.ToString("yyyy-MM-dd") }
            };

            // Agregar atributos adicionales si existen
            if (additionalAttributes != null)
            {
                foreach (var attr in additionalAttributes)
                {
                    attributes[attr.Key] = attr.Value;
                }
            }

            var createContact = new CreateContact(
                email: email,
                attributes: attributes,
                listIds: new List<long?> { 2 }, // ID de lista "Usuarios Registrados" - ajustar según tu Brevo
                updateEnabled: true // Actualizar si ya existe
            );

            await _contactsApi.CreateContactAsync(createContact);
        }
        catch (Exception ex)
        {
            // Log error pero no fallar el flujo principal
            Console.WriteLine($"Error sincronizando contacto con Brevo: {ex.Message}");
        }
    }

    public async System.Threading.Tasks.Task SendVerificationEmailAsync(string toEmail, string toName, string verificationToken, int userId)
    {
        try
        {
            Console.WriteLine($"[EmailService] Intentando enviar email de verificación a: {toEmail}");
            
            var senderEmail = _config["Brevo:SenderEmail"] ?? "noreply@twittetec.com";
            var senderName = _config["Brevo:SenderName"] ?? "Twittetec";
            var frontendUrl = _config["Brevo:FrontendUrl"] ?? "https://app.twittetec.com";
            
            // Generar MD5 del userId para validación adicional
            var userIdHash = GenerateMD5Hash(userId.ToString());
            var verificationUrl = $"{frontendUrl}/verify-email?token={verificationToken}&uid={userIdHash}";

            // Intentar usar template del dashboard si está configurado
            var templateId = _config.GetValue<long?>("Brevo:VerificationEmailTemplateId");
            
            Console.WriteLine($"[EmailService] Template ID: {templateId}, Sender: {senderEmail}");

        var sendSmtpEmail = new SendSmtpEmail
        {
            Sender = new SendSmtpEmailSender(senderName, senderEmail),
            To = new List<SendSmtpEmailTo> { new SendSmtpEmailTo(toEmail, toName) },
            Tags = new List<string> { "email_verification", "transactional", "onboarding" },
            Params = new
            {
                userName = toName,
                verificationUrl = verificationUrl,
                verificationToken = verificationToken,
                userIdHash = userIdHash,
                frontendUrl = frontendUrl,
                expirationHours = "24"
            }
        };

        // Si hay templateId configurado, usarlo; sino usar HTML inline
        if (templateId.HasValue && templateId.Value > 0)
        {
            sendSmtpEmail.TemplateId = templateId.Value;
        }
        else
        {
            sendSmtpEmail.Subject = "Verifica tu cuenta en Twittetec";
            sendSmtpEmail.HtmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px;'>
                        <h1 style='color: #1da1f2; margin-bottom: 20px;'>¡Bienvenido a Twittetec!</h1>
                        
                        <p>Hola <strong>{toName}</strong>,</p>
                        
                        <p>Gracias por registrarte en Twittetec. Para completar tu registro y comenzar a usar tu cuenta, necesitamos verificar tu dirección de correo electrónico.</p>
                        
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{verificationUrl}' 
                               style='background-color: #1da1f2; 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      display: inline-block;
                                      font-weight: bold;'>
                                Verificar mi email
                            </a>
                        </div>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style='background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;'>
                            {verificationUrl}
                        </p>
                        
                        <p style='color: #6c757d; font-size: 0.9em; margin-top: 30px;'>
                            Este enlace expirará en 24 horas. Si no solicitaste esta cuenta, puedes ignorar este correo.
                        </p>
                        
                        <hr style='border: none; border-top: 1px solid #dee2e6; margin: 20px 0;'>
                        
                        <p style='color: #6c757d; font-size: 0.8em; text-align: center;'>
                            © 2026 Twittetec - Red Social ETEC
                        </p>
                    </div>
                </body>
                </html>
            ";
        }

            Console.WriteLine($"[EmailService] Enviando email con template: {(templateId.HasValue ? templateId.Value.ToString() : "HTML inline")}");
            
            var result = await _apiInstance.SendTransacEmailAsync(sendSmtpEmail);
            
            Console.WriteLine($"[EmailService] ✓ Email de verificación enviado exitosamente a {toEmail}. MessageId: {result.MessageId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] ✗ ERROR enviando email de verificación a {toEmail}:");
            Console.WriteLine($"[EmailService] Tipo: {ex.GetType().Name}");
            Console.WriteLine($"[EmailService] Mensaje: {ex.Message}");
            Console.WriteLine($"[EmailService] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[EmailService] InnerException: {ex.InnerException.Message}");
            }
            throw; // Re-lanzar para que el controlador lo maneje
        }
    }

    public async System.Threading.Tasks.Task SendWelcomeEmailAsync(string toEmail, string toName)
    {
        try
        {
            Console.WriteLine($"[EmailService] Enviando email de bienvenida a: {toEmail}");
            
            var senderEmail = _config["Brevo:SenderEmail"] ?? "support@twittetec.com";
            var senderName = _config["Brevo:SenderName"] ?? "Twittetec";
            var templateId = _config.GetValue<long?>("Brevo:WelcomeEmailTemplateId");

            var sendSmtpEmail = new SendSmtpEmail
            {
                Sender = new SendSmtpEmailSender(senderName, senderEmail),
                To = new List<SendSmtpEmailTo> { new SendSmtpEmailTo(toEmail, toName) },
                Tags = new List<string> { "welcome", "transactional", "onboarding" },
                Params = new
                {
                    userName = toName
                }
            };

            if (templateId.HasValue && templateId.Value > 0)
            {
                sendSmtpEmail.TemplateId = templateId.Value;
            }
            else
            {
                sendSmtpEmail.Subject = "¡Bienvenido a Twittetec!";
            sendSmtpEmail.HtmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px;'>
                        <h1 style='color: #1da1f2; margin-bottom: 20px;'>¡Bienvenido a Twittetec, {toName}!</h1>
                        
                        <p>Tu cuenta ha sido verificada exitosamente. Ya puedes comenzar a:</p>
                        
                        <ul style='line-height: 2;'>
                            <li>Publicar tus pensamientos</li>
                            <li>Seguir a otros estudiantes</li>
                            <li>Participar en conversaciones</li>
                            <li>Compartir contenido multimedia</li>
                        </ul>
                        
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='https://app.twittetec.com' 
                               style='background-color: #1da1f2; 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      display: inline-block;
                                      font-weight: bold;'>
                                Ir a TwittetEc
                            </a>
                        </div>
                        
                        <hr style='border: none; border-top: 1px solid #dee2e6; margin: 20px 0;'>
                        
                        <p style='color: #6c757d; font-size: 0.8em; text-align: center;'>
                            © 2026 TwittetEc - Red Social ETEC
                        </p>
                    </div>
                </body>
                </html>
            ";
            }

            var result = await _apiInstance.SendTransacEmailAsync(sendSmtpEmail);
            Console.WriteLine($"[EmailService] ✓ Email de bienvenida enviado exitosamente a {toEmail}. MessageId: {result.MessageId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] ✗ ERROR enviando email de bienvenida a {toEmail}: {ex.Message}");
            throw;
        }
    }

    public async System.Threading.Tasks.Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetToken)
    {
        try
        {
            Console.WriteLine($"[EmailService] Enviando email de reset de contraseña a: {toEmail}");
            
            var senderEmail = _config["Brevo:SenderEmail"] ?? "support@twittetec.com";
            var senderName = _config["Brevo:SenderName"] ?? "Twittetec";
            var frontendUrl = _config["Brevo:FrontendUrl"] ?? "https://app.twittetec.com";
            var resetUrl = $"{frontendUrl}/reset-password?token={resetToken}";
            var templateId = _config.GetValue<long?>("Brevo:PasswordResetTemplateId");

            var sendSmtpEmail = new SendSmtpEmail
            {
                Sender = new SendSmtpEmailSender(senderName, senderEmail),
                To = new List<SendSmtpEmailTo> { new SendSmtpEmailTo(toEmail, toName) },
                Tags = new List<string> { "password_reset", "transactional", "security" },
                Params = new
                {
                    userName = toName,
                    resetUrl = resetUrl,
                    expirationHours = "1"
                }
            };

            if (templateId.HasValue && templateId.Value > 0)
            {
                sendSmtpEmail.TemplateId = templateId.Value;
            }
            else
            {
                sendSmtpEmail.Subject = "Restablecer contraseña - Twittetec";
            sendSmtpEmail.HtmlContent = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                </head>
                <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px;'>
                        <h1 style='color: #1da1f2; margin-bottom: 20px;'>Restablecer Contraseña</h1>
                        
                        <p>Hola <strong>{toName}</strong>,</p>
                        
                        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Twittetec.</p>
                        
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{resetUrl}' 
                               style='background-color: #1da1f2; 
                                      color: white; 
                                      padding: 15px 30px; 
                                      text-decoration: none; 
                                      border-radius: 5px; 
                                      display: inline-block;
                                      font-weight: bold;'>
                                Restablecer Contraseña
                            </a>
                        </div>
                        
                        <p>O copia y pega este enlace en tu navegador:</p>
                        <p style='background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all;'>
                            {resetUrl}
                        </p>
                        
                        <p style='color: #e0245e; font-weight: bold; margin-top: 30px;'>
                            ⚠️ Este enlace expirará en 1 hora.
                        </p>
                        
                        <p style='color: #6c757d; font-size: 0.9em;'>
                            Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.
                        </p>
                        
                        <hr style='border: none; border-top: 1px solid #dee2e6; margin: 20px 0;'>
                        
                        <p style='color: #6c757d; font-size: 0.8em; text-align: center;'>
                            © 2026 Twittetec - Red Social ETEC
                        </p>
                    </div>
                </body>
                </html>
            ";
            }

            var result = await _apiInstance.SendTransacEmailAsync(sendSmtpEmail);
            Console.WriteLine($"[EmailService] ✓ Email de reset enviado exitosamente a {toEmail}. MessageId: {result.MessageId}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[EmailService] ✗ ERROR enviando email de reset a {toEmail}: {ex.Message}");
            throw;
        }
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
