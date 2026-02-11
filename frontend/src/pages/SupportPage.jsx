import { useTheme } from '../context/ThemeContext';

function SupportPage() {
  const { theme } = useTheme();

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
    }}>
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
          Soporte
        </h1>
        <p style={{
          margin: '0 0 32px 0',
          fontSize: '15px',
          color: theme.colors.textSecondary,
          lineHeight: '1.5',
        }}>
          ¿Necesitas ayuda? Contacta a nuestro equipo de soporte a través de cualquiera de los siguientes medios.
        </p>

        {/* Email */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: theme.colors.primaryLight || 'rgba(29,161,242,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>
            ✉️
          </div>
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '17px',
              fontWeight: '700',
              color: theme.colors.textPrimary,
            }}>
              Correo electrónico
            </h3>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: theme.colors.textSecondary,
            }}>
              Escríbenos y te responderemos a la brevedad.
            </p>
            <a
              href="mailto:support@twittetec.com"
              style={{
                color: theme.colors.primary || '#1da1f2',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              support@twittetec.com
            </a>
          </div>
        </div>

        {/* Teléfono / WhatsApp */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
          marginBottom: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#25D36620',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            flexShrink: 0,
          }}>
            📱
          </div>
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '17px',
              fontWeight: '700',
              color: theme.colors.textPrimary,
            }}>
              Teléfono / WhatsApp
            </h3>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              color: theme.colors.textSecondary,
            }}>
              Comunícate con nosotros directamente.
            </p>
            <a
              href="https://wa.me/5492616301072"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#25D366',
                fontSize: '15px',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              +54 9 261 630-1072
            </a>
          </div>
        </div>

        {/* Horarios */}
        <div style={{
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: theme.colors.backgroundSecondary,
          border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '20px',
              minWidth: '24px',
            }}>
              ℹ️
            </div>
            <div>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '15px',
                fontWeight: '700',
                color: theme.colors.textPrimary,
              }}>
                Información
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                lineHeight: '1.5',
              }}>
                Nuestro equipo de soporte está disponible de lunes a viernes de 8:00 a 18:00 (hora Argentina). 
                Los mensajes recibidos fuera de horario serán respondidos el siguiente día hábil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportPage;
