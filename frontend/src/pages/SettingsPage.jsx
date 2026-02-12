import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

function SettingsPage() {
  const { theme, currentTheme, setTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ELIMINAR') return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await usersAPI.deleteMyAccount();
      await logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Error al eliminar la cuenta. Intenta de nuevo.');
    } finally {
      setIsDeleting(false);
    }
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
      </div>

      {/* Sección Política de Privacidad */}
      <div style={{
        marginTop: '24px',
        backgroundColor: theme.colors.cardBackground,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: theme.colors.shadowMd,
        border: `1px solid ${theme.colors.border}`,
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: '700',
          color: theme.colors.textPrimary,
        }}>
          Legal
        </h2>
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: theme.colors.textSecondary,
          lineHeight: '1.5',
        }}>
          Consulta nuestra política de privacidad para saber cómo manejamos tus datos.
        </p>
        <button
          onClick={() => navigate('/privacy-policy', { state: { from: '/settings' } })}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: `1px solid ${theme.colors.primary}`,
            backgroundColor: 'transparent',
            color: theme.colors.primary,
            fontWeight: '600',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.colors.primary;
          }}
        >
          📄 Política de Privacidad
        </button>
      </div>

      {/* Sección Eliminar Cuenta */}
      <div style={{
        marginTop: '24px',
        backgroundColor: theme.colors.cardBackground,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: theme.colors.shadowMd,
        border: `1px solid ${theme.colors.error || '#e74c3c'}`,
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '20px',
          fontWeight: '700',
          color: theme.colors.error || '#e74c3c',
        }}>
          Zona de Peligro
        </h2>
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '14px',
          color: theme.colors.textSecondary,
          lineHeight: '1.5',
        }}>
          Una vez que elimines tu cuenta, se borrarán todos tus datos permanentemente: publicaciones, mensajes, likes, seguidores y toda tu información. Esta acción no se puede deshacer.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.error || '#e74c3c'}`,
              backgroundColor: 'transparent',
              color: theme.colors.error || '#e74c3c',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.error || '#e74c3c';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.error || '#e74c3c';
            }}
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: theme.colors.errorLight || 'rgba(231, 76, 60, 0.1)',
            border: `1px solid ${theme.colors.error || '#e74c3c'}`,
          }}>
            <p style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '600',
              color: theme.colors.error || '#e74c3c',
            }}>
              ¿Estás seguro? Escribe <strong>ELIMINAR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe ELIMINAR"
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.inputBorder}`,
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.textPrimary,
                fontSize: '15px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'ELIMINAR' || isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: deleteConfirmText === 'ELIMINAR' ? (theme.colors.error || '#e74c3c') : (theme.colors.border || '#ccc'),
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: deleteConfirmText === 'ELIMINAR' && !isDeleting ? 'pointer' : 'not-allowed',
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: 'transparent',
                  color: theme.colors.textPrimary,
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
            {deleteError && (
              <p style={{
                marginTop: '12px',
                fontSize: '14px',
                color: theme.colors.error || '#e74c3c',
              }}>
                {deleteError}
              </p>
            )}
          </div>
        )}
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
