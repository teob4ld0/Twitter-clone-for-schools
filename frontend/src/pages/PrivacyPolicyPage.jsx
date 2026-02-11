import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

function PrivacyPolicyPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const handleBack = () => {
    if (from) {
      navigate(from);
    } else {
      navigate(-1);
    }
  };

  const sectionStyle = {
    marginBottom: '24px',
  };

  const h2Style = {
    margin: '0 0 12px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: theme.colors.textPrimary,
  };

  const h3Style = {
    margin: '16px 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: theme.colors.textPrimary,
  };

  const pStyle = {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: theme.colors.textSecondary,
    lineHeight: '1.6',
  };

  const ulStyle = {
    margin: '0 0 12px 0',
    paddingLeft: '20px',
    fontSize: '14px',
    color: theme.colors.textSecondary,
    lineHeight: '1.8',
  };

  const hrStyle = {
    border: 'none',
    borderTop: `1px solid ${theme.colors.border}`,
    margin: '24px 0',
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
    }}>
      <button
        onClick={handleBack}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.primary,
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '16px',
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        ← Volver
      </button>

      <div style={{
        backgroundColor: theme.colors.cardBackground,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: theme.colors.shadowMd,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: theme.colors.textPrimary,
        }}>
          Política de Privacidad de Twittetec
        </h1>
        <p style={{
          margin: '0 0 24px 0',
          fontSize: '13px',
          color: theme.colors.textSecondary,
        }}>
          <strong>Última actualización:</strong> 10 de febrero de 2026
        </p>

        <hr style={hrStyle} />

        {/* 1. Introducción */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>1. Introducción</h2>
          <p style={pStyle}>
            Bienvenido a <strong>Twittetec</strong>, una red social diseñada para escuelas. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos tu información personal cuando usas nuestra aplicación.
          </p>
          <p style={pStyle}>
            Al usar Twittetec, aceptas las prácticas descritas en esta política. Si no estás de acuerdo con alguna parte de esta política, por favor no uses la aplicación.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 2. Información que recopilamos */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>2. Información que Recopilamos</h2>

          <h3 style={h3Style}>2.1 Información de la Cuenta</h3>
          <ul style={ulStyle}>
            <li><strong>Nombre de usuario</strong> (máximo 25 caracteres)</li>
            <li><strong>Dirección de email</strong> (verificada)</li>
            <li><strong>Contraseña</strong> (almacenada cifrada como hash)</li>
            <li><strong>Fecha de creación de la cuenta</strong></li>
            <li><strong>Foto de perfil</strong> (opcional, URL pública)</li>
            <li><strong>Estado de verificación de email</strong></li>
            <li><strong>Estado de la cuenta</strong> (activa/baneada)</li>
          </ul>

          <h3 style={h3Style}>2.2 Contenido Generado por el Usuario</h3>
          <ul style={ulStyle}>
            <li><strong>Publicaciones (Statuses):</strong> Texto, imágenes y videos que compartes</li>
            <li><strong>Respuestas y comentarios</strong> a publicaciones de otros usuarios</li>
            <li><strong>Likes</strong> en publicaciones</li>
            <li><strong>Reposts</strong> de contenido de otros usuarios</li>
            <li><strong>Mensajes directos</strong> enviados a través del chat</li>
          </ul>

          <h3 style={h3Style}>2.3 Datos de Interacción Social</h3>
          <ul style={ulStyle}>
            <li><strong>Seguidores y seguidos:</strong> Lista de usuarios que sigues y que te siguen</li>
            <li><strong>Seguidores mutuos</strong></li>
            <li><strong>Interacciones con perfiles</strong> (visitas a perfiles)</li>
            <li><strong>Señales de interés:</strong> Registros de actividad como abrir perfiles, interacciones con publicaciones</li>
          </ul>

          <h3 style={h3Style}>2.4 Datos de Uso y Analítica</h3>
          <ul style={ulStyle}>
            <li><strong>Marcas de tiempo</strong> de actividades (creación de publicaciones, mensajes, etc.)</li>
            <li><strong>Patrones de uso de la app</strong></li>
            <li><strong>Historial de interacción con contenido</strong></li>
          </ul>

          <h3 style={h3Style}>2.5 Autenticación con Google OAuth (Opcional)</h3>
          <p style={pStyle}>Si eliges iniciar sesión con Google, recopilamos:</p>
          <ul style={ulStyle}>
            <li>Tu dirección de email de Google</li>
            <li>Tu nombre de usuario de Google</li>
            <li>Tu ID de Google</li>
          </ul>

          <h3 style={h3Style}>2.6 Notificaciones Push (Opcional)</h3>
          <ul style={ulStyle}>
            <li><strong>Tokens de dispositivo</strong> para enviar notificaciones vía Firebase Cloud Messaging (FCM)</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 3. Cómo usamos tu información */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>3. Cómo Usamos tu Información</h2>

          <h3 style={h3Style}>3.1 Funcionalidad de la Aplicación</h3>
          <ul style={ulStyle}>
            <li>Crear y administrar tu cuenta</li>
            <li>Permitir la publicación de contenido (texto, imágenes, videos)</li>
            <li>Facilitar la comunicación con otros usuarios (chats, respuestas)</li>
            <li>Administrar relaciones sociales (seguir/dejar de seguir usuarios)</li>
            <li>Mostrar tu perfil a otros usuarios</li>
          </ul>

          <h3 style={h3Style}>3.2 Personalización de la Experiencia</h3>
          <ul style={ulStyle}>
            <li>Mostrar un feed personalizado basado en tus intereses y seguidos</li>
            <li>Recomendar usuarios y contenido relevante</li>
            <li>Mejorar algoritmos de visualización de contenido</li>
          </ul>

          <h3 style={h3Style}>3.3 Comunicación</h3>
          <ul style={ulStyle}>
            <li>Enviar notificaciones sobre interacciones (likes, comentarios, nuevos seguidores)</li>
            <li>Enviar notificaciones de mensajes directos</li>
            <li>Verificar tu dirección de email</li>
          </ul>

          <h3 style={h3Style}>3.4 Seguridad y Moderación</h3>
          <ul style={ulStyle}>
            <li>Prevenir abuso y comportamiento inapropiado</li>
            <li>Hacer cumplir nuestros Términos de Servicio</li>
            <li>Banear cuentas que violen nuestras políticas</li>
          </ul>

          <h3 style={h3Style}>3.5 Mejora del Servicio</h3>
          <ul style={ulStyle}>
            <li>Analizar patrones de uso para mejorar la aplicación</li>
            <li>Registrar señales de interés para optimizar la experiencia de usuario</li>
            <li>Corregir errores y resolver problemas técnicos</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 4. Compartir tu información */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>4. Compartir tu Información</h2>

          <h3 style={h3Style}>4.1 Información Pública</h3>
          <p style={pStyle}>La siguiente información es <strong>pública</strong> y visible para todos los usuarios de la app:</p>
          <ul style={ulStyle}>
            <li>Tu nombre de usuario</li>
            <li>Tu foto de perfil</li>
            <li>Tus publicaciones (a menos que sean respuestas privadas)</li>
            <li>Tus listas de seguidores y seguidos</li>
            <li>Tus likes y reposts</li>
            <li>Conteos de publicaciones, seguidores y seguidos</li>
          </ul>

          <h3 style={h3Style}>4.2 Información Privada</h3>
          <p style={pStyle}>Los siguientes datos son <strong>privados</strong> y no se comparten:</p>
          <ul style={ulStyle}>
            <li>Tu dirección de email</li>
            <li>Tu contraseña (almacenada como hash cifrado)</li>
            <li>Tus mensajes directos (solo visibles para ti y el destinatario)</li>
            <li>Tokens de autenticación</li>
          </ul>

          <h3 style={h3Style}>4.3 Terceros</h3>
          <p style={pStyle}>No vendemos ni compartimos tu información personal con terceros con fines de marketing.</p>
          <p style={pStyle}>Compartimos información con proveedores de servicios:</p>
          <ul style={ulStyle}>
            <li><strong>Google Cloud Storage:</strong> Para almacenar imágenes y videos (con URLs públicas)</li>
            <li><strong>Google OAuth:</strong> Si inicias sesión con Google</li>
            <li><strong>Firebase Cloud Messaging:</strong> Para enviar notificaciones push</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 5. Almacenamiento y Seguridad de Datos */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>5. Almacenamiento y Seguridad de Datos</h2>

          <h3 style={h3Style}>5.1 Ubicación de Datos</h3>
          <ul style={ulStyle}>
            <li>Los datos se almacenan en una <strong>base de datos MySQL</strong></li>
            <li>Las imágenes y videos se almacenan en <strong>Google Cloud Storage</strong> o localmente en el servidor</li>
            <li>Los datos de autenticación están protegidos con <strong>tokens JWT</strong></li>
          </ul>

          <h3 style={h3Style}>5.2 Medidas de Seguridad</h3>
          <ul style={ulStyle}>
            <li>Las contraseñas se almacenan con <strong>hash criptográfico</strong> (nunca en texto plano)</li>
            <li>Las comunicaciones están protegidas vía <strong>HTTPS</strong></li>
            <li>Tokens de autenticación con <strong>expiración automática</strong></li>
            <li>Verificación obligatoria de email</li>
          </ul>

          <h3 style={h3Style}>5.3 Retención de Datos</h3>
          <ul style={ulStyle}>
            <li>Mantenemos tus datos mientras tu cuenta esté activa</li>
            <li>Si eliminas tu cuenta, tus datos personales serán eliminados (ver sección 7)</li>
            <li>Las publicaciones públicas pueden permanecer almacenadas por razones de archivo o legales</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 6. Tus Derechos */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>6. Tus Derechos</h2>

          <h3 style={h3Style}>6.1 Acceso y Actualización</h3>
          <ul style={ulStyle}>
            <li>Ver y editar tu perfil (nombre de usuario, foto de perfil)</li>
            <li>Ver tu historial de publicaciones, likes y reposts</li>
            <li>Actualizar tu foto de perfil</li>
          </ul>

          <h3 style={h3Style}>6.2 Eliminación de Contenido</h3>
          <ul style={ulStyle}>
            <li>Eliminar tus publicaciones</li>
            <li>Eliminar mensajes directos</li>
            <li>Dejar de seguir usuarios</li>
          </ul>

          <h3 style={h3Style}>6.3 Control de Privacidad</h3>
          <ul style={ulStyle}>
            <li>Controlar quién puede seguirte (aceptando o rechazando solicitudes)</li>
            <li>Bloquear usuarios (próximamente)</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 7. Eliminación de Cuenta */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>7. Eliminación de Cuenta</h2>
          <p style={pStyle}>Puedes solicitar la eliminación de tu cuenta contactándonos a través de:</p>
          <ul style={ulStyle}>
            <li><strong>Email de contacto:</strong> support@twittetec.app</li>
            <li><strong>Formulario de contacto:</strong> https://twittetec.app/contact</li>
            <li><strong>Sitio web:</strong> https://twittetec.app</li>
          </ul>
          <p style={pStyle}>Cuando eliminas tu cuenta:</p>
          <ul style={ulStyle}>
            <li>Tu perfil dejará de ser visible</li>
            <li>Tus datos personales (email, contraseña) serán eliminados</li>
            <li>Tus publicaciones pueden ser anonimizadas o eliminadas según tu solicitud</li>
            <li>Los mensajes directos serán eliminados</li>
          </ul>
          <p style={pStyle}>El proceso de eliminación puede tardar hasta <strong>30 días</strong>.</p>
        </div>

        <hr style={hrStyle} />

        {/* 8. Uso por Menores */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>8. Uso por Menores</h2>
          <p style={pStyle}>
            Twittetec está diseñado para uso en entornos escolares. Si eres menor de 13 años, necesitas el consentimiento de un padre o tutor para usar la aplicación.
          </p>
          <p style={pStyle}>
            Si eres padre/tutor y descubres que tu hijo ha proporcionado información sin tu consentimiento, contáctanos para eliminar dicha información.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 9. Cambios a esta Política */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>9. Cambios a esta Política de Privacidad</h2>
          <p style={pStyle}>Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos de cambios significativos a través de:</p>
          <ul style={ulStyle}>
            <li>Una notificación en la aplicación</li>
            <li>Un email a tu cuenta registrada</li>
          </ul>
          <p style={pStyle}>
            La fecha de "Última actualización" al inicio de esta política indica cuándo se realizó el último cambio.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 10. Contacto */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>10. Contacto</h2>
          <p style={pStyle}>Si tienes preguntas sobre esta Política de Privacidad o cómo manejamos tus datos, contáctanos:</p>
          <ul style={ulStyle}>
            <li><strong>Email:</strong> support@twittetec.app</li>
            <li><strong>Sitio web de contacto:</strong> https://twittetec.app/contact</li>
            <li><strong>Soporte:</strong> Disponible a través de la configuración de la app</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 11. Cumplimiento Legal */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>11. Cumplimiento Legal</h2>
          <p style={pStyle}>
            Nos reservamos el derecho de divulgar tu información personal si la ley lo requiere o si creemos de buena fe que tal acción es necesaria para:
          </p>
          <ul style={ulStyle}>
            <li>Cumplir con obligaciones legales</li>
            <li>Proteger y defender nuestros derechos o propiedad</li>
            <li>Prevenir fraude o abuso de la plataforma</li>
            <li>Proteger la seguridad de los usuarios</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 12. Tecnologías que Usamos */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>12. Tecnologías que Usamos</h2>

          <h3 style={h3Style}>12.1 Cookies y Almacenamiento Local</h3>
          <ul style={ulStyle}>
            <li>Usamos <strong>localStorage</strong> para guardar preferencias del usuario (tema claro/oscuro)</li>
            <li>Los tokens de autenticación se guardan localmente en el dispositivo</li>
          </ul>

          <h3 style={h3Style}>12.2 Servicios de Terceros</h3>
          <ul style={ulStyle}>
            <li><strong>Google OAuth:</strong> Para autenticación opcional con Google</li>
            <li><strong>Google Cloud Storage:</strong> Para almacenamiento de medios</li>
            <li><strong>Firebase Cloud Messaging (FCM):</strong> Para notificaciones push</li>
            <li><strong>SignalR:</strong> Para comunicación en tiempo real (chats, notificaciones)</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        {/* 13. Transferencias Internacionales de Datos */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>13. Transferencias Internacionales de Datos</h2>
          <p style={pStyle}>
            Tus datos pueden ser transferidos y almacenados en servidores ubicados fuera de tu país de residencia. Al usar Twittetec, consientes estas transferencias.
          </p>
          <p style={pStyle}>
            Tomamos medidas para asegurar que tus datos sean tratados de manera segura y de acuerdo con esta Política de Privacidad, sin importar dónde se procesen.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 14. Seguridad de Datos */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>14. Seguridad de Datos</h2>
          <p style={pStyle}>
            Implementamos medidas técnicas y organizacionales apropiadas para proteger tu información personal, incluyendo:
          </p>
          <ul style={ulStyle}>
            <li>Cifrado de datos sensibles</li>
            <li>Mecanismos de autenticación seguros (tokens JWT)</li>
            <li>Evaluaciones regulares de seguridad</li>
            <li>Controles de acceso y monitoreo</li>
          </ul>
          <p style={pStyle}>
            Sin embargo, ningún método de transmisión por internet o almacenamiento electrónico es 100% seguro. Aunque nos esforzamos por proteger tus datos, no podemos garantizar seguridad absoluta.
          </p>
        </div>

        <hr style={hrStyle} />

        {/* 15. Tus Opciones */}
        <div style={sectionStyle}>
          <h2 style={h2Style}>15. Tus Opciones</h2>
          <p style={pStyle}>Puedes:</p>
          <ul style={ulStyle}>
            <li><strong>Desactivar notificaciones:</strong> Deshabilitar las notificaciones push en la configuración de tu dispositivo</li>
            <li><strong>Limitar la recopilación de datos:</strong> Elegir no usar funciones opcionales como Google OAuth</li>
            <li><strong>Controlar tu contenido:</strong> Eliminar publicaciones, mensajes y medios en cualquier momento</li>
            <li><strong>Administrar tu perfil:</strong> Actualizar o eliminar tu foto de perfil</li>
          </ul>
        </div>

        <hr style={hrStyle} />

        <p style={{
          margin: 0,
          fontSize: '13px',
          color: theme.colors.textSecondary,
          textAlign: 'center',
        }}>
          © 2026 Twittetec. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
