import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

function SettingsPage() {
  const { theme, currentTheme, setTheme, isDark } = useTheme();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

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
          Configuración
        </h1>
        <p style={{
          margin: '0 0 32px 0',
          fontSize: '15px',
          color: theme.colors.textSecondary,
        }}>
          Personaliza la apariencia de tu aplicación
        </p>

        {/* Sección de Tema */}
        <div style={{
          marginBottom: '32px',
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: theme.colors.textPrimary,
          }}>
            Apariencia
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            {/* Tarjeta de Tema Claro */}
            <div
              onClick={() => handleThemeChange('light')}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '20px',
                borderRadius: '12px',
                border: `3px solid ${currentTheme === 'light' ? theme.colors.primary : theme.colors.border}`,
                backgroundColor: currentTheme === 'light' ? theme.colors.primaryLight : theme.colors.backgroundSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (currentTheme !== 'light') {
                  e.currentTarget.style.borderColor = theme.colors.borderHover;
                  e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                }
              }}
              onMouseLeave={(e) => {
                if (currentTheme !== 'light') {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
                }
              }}
            >
              {currentTheme === 'light' && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}>
                  ✓
                </div>
              )}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#1da1f2',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                ☀️
              </div>
              <h3 style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: theme.colors.textPrimary,
              }}>
                Tema Claro
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.colors.textSecondary,
              }}>
                Fondo blanco con texto oscuro
              </p>
              
              {/* Preview del tema claro */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e1e8ed',
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#0f1419',
                  marginBottom: '8px',
                  fontWeight: '600',
                }}>
                  Vista previa
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#536471',
                  lineHeight: '1.4',
                }}>
                  Texto principal en negro sobre fondo blanco
                </div>
              </div>
            </div>

            {/* Tarjeta de Tema Oscuro */}
            <div
              onClick={() => handleThemeChange('dark')}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '20px',
                borderRadius: '12px',
                border: `3px solid ${currentTheme === 'dark' ? theme.colors.primary : theme.colors.border}`,
                backgroundColor: currentTheme === 'dark' ? theme.colors.primaryLight : theme.colors.backgroundSecondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (currentTheme !== 'dark') {
                  e.currentTarget.style.borderColor = theme.colors.borderHover;
                  e.currentTarget.style.backgroundColor = theme.colors.backgroundHover;
                }
              }}
              onMouseLeave={(e) => {
                if (currentTheme !== 'dark') {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.backgroundColor = theme.colors.backgroundSecondary;
                }
              }}
            >
              {currentTheme === 'dark' && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}>
                  ✓
                </div>
              )}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#1da1f2',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}>
                🌙
              </div>
              <h3 style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: theme.colors.textPrimary,
              }}>
                Tema Oscuro
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.colors.textSecondary,
              }}>
                Fondo oscuro con texto claro
              </p>
              
              {/* Preview del tema oscuro */}
              <div style={{
                marginTop: '16px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#000000',
                border: '1px solid #2f3336',
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#e7e9ea',
                  marginBottom: '8px',
                  fontWeight: '600',
                }}>
                  Vista previa
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#71767b',
                  lineHeight: '1.4',
                }}>
                  Texto claro sobre fondo negro profundo
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
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
                Sobre los temas
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: theme.colors.textSecondary,
                lineHeight: '1.5',
              }}>
                Los temas están completamente hardcodeados y no se ven afectados por la configuración de tu dispositivo o navegador. Tu preferencia se guarda automáticamente y se aplicará cada vez que visites la aplicación.
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {showSuccess && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: theme.colors.successLight,
            border: `1px solid ${theme.colors.success}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideDown 0.3s ease',
          }}>
            <div style={{
              fontSize: '20px',
            }}>
              ✅
            </div>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: theme.colors.success,
            }}>
              Tema actualizado correctamente
            </div>
          </div>
        )}
      </div>

      {/* Sección de demostración de colores */}
      <div style={{
        marginTop: '24px',
        backgroundColor: theme.colors.cardBackground,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: theme.colors.shadowMd,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '20px',
          fontWeight: '700',
          color: theme.colors.textPrimary,
        }}>
          Demostración de Elementos
        </h2>

        {/* Botones */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.textPrimary,
          }}>
            Botones
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: theme.colors.buttonPrimary,
              color: theme.colors.buttonPrimaryText,
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
            }}>
              Botón Principal
            </button>
            <button style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.buttonSecondary,
              color: theme.colors.buttonSecondaryText,
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
            }}>
              Botón Secundario
            </button>
            <button style={{
              padding: '10px 20px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: theme.colors.buttonDanger,
              color: theme.colors.buttonDangerText,
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
            }}>
              Botón de Peligro
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.textPrimary,
          }}>
            Campos de Texto
          </h3>
          <input
            type="text"
            placeholder="Escribe algo aquí..."
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.inputBorder}`,
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.textPrimary,
              fontSize: '15px',
            }}
          />
        </div>

        {/* Notificaciones de estado */}
        <div>
          <h3 style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.textPrimary,
          }}>
            Notificaciones
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: theme.colors.successLight,
              border: `1px solid ${theme.colors.success}`,
              color: theme.colors.success,
              fontSize: '14px',
            }}>
              ✅ Acción completada exitosamente
            </div>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: theme.colors.errorLight,
              border: `1px solid ${theme.colors.error}`,
              color: theme.colors.error,
              fontSize: '14px',
            }}>
              ❌ Ha ocurrido un error
            </div>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: theme.colors.warningLight,
              border: `1px solid ${theme.colors.warning}`,
              color: theme.colors.warning,
              fontSize: '14px',
            }}>
              ⚠️ Advertencia: Revisa esta información
            </div>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: theme.colors.infoLight,
              border: `1px solid ${theme.colors.info}`,
              color: theme.colors.info,
              fontSize: '14px',
            }}>
              ℹ️ Información importante
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

export default SettingsPage;
