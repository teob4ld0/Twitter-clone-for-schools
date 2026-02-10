import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import MobileNav from '../components/MobileNav';
import { useState, useEffect } from 'react';

function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Verificar si el usuario es admin (no tiene email de alumno)
    if (user && user.email) {
      const isAdminUser = !user.email.endsWith('@alumno.etec.um.edu.ar');
      setIsAdmin(isAdminUser);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ paddingBottom: isMobile ? '70px' : '0', backgroundColor: theme.colors.background, minHeight: '100vh' }}>
      {/* Navbar desktop */}
      {!isMobile && (
        <nav style={{
          backgroundColor: theme.colors.navbarBackground,
          color: theme.colors.navbarText,
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: theme.colors.shadowMd,
          borderBottom: `1px solid ${theme.colors.navbarBorder}`,
        }}>
          <h2 style={{ margin: 0, color: theme.colors.textPrimary }}>Twitetec</h2>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center'
          }}>
            <Link to="/" style={{
              color: theme.colors.navbarText,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}>Feed</Link>
            <Link to="/chats" style={{
              color: theme.colors.navbarText,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}>Chats</Link>
            <Link to="/notifications" style={{ 
              color: theme.colors.navbarText,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              position: 'relative' 
            }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  backgroundColor: theme.colors.notificationBadge,
                  color: theme.colors.notificationBadgeText,
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {"!"}
                </span>
              )}
            </Link>
            {isAdmin && <Link to="/admin" style={{
              color: theme.colors.textInverted,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              backgroundColor: '#9b59b6',
              fontWeight: 'bold'
            }}>Admin</Link>}
            
            <Link to="/settings" style={{
              color: theme.colors.navbarText,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ fontSize: '18px' }}>{isDark ? '🌙' : '☀️'}</span>
              Configuración
            </Link>

            {isAuthenticated() ? (
              <>
                <span style={{
                  color: theme.colors.navbarText,
                  fontWeight: 'bold'
                }}>Hola, 
                  <button onClick={() => navigate(`/perfil/${user?.id}`)} style={{ 
                    color: theme.colors.navbarText,
                    textDecoration: 'none',
                    padding: '3px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}>
                    {user?.username}
                  </button>
                </span>
                <button onClick={handleLogout} style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: theme.colors.buttonDanger,
                  color: theme.colors.buttonDangerText,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  color: theme.colors.navbarText,
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}>Login</Link>
                <Link to="/register" style={{
                  color: theme.colors.navbarText,
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}>Register</Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Header mobile */}
      {isMobile && (
        <nav style={{
          backgroundColor: theme.colors.navbarBackground,
          color: theme.colors.navbarText,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: theme.colors.shadowMd,
          borderBottom: `1px solid ${theme.colors.navbarBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: theme.colors.textPrimary }}>Twitetec</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={toggleTheme} 
              style={{
                backgroundColor: 'transparent',
                color: theme.colors.navbarText,
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
                fontSize: '20px',
                transition: 'background-color 0.2s'
              }}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
            {isAuthenticated() && (
              <button onClick={handleLogout} style={{
                backgroundColor: 'transparent',
                color: theme.colors.navbarText,
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}>
                <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            )}
          </div>
        </nav>
      )}
      
      <main style={isMobile ? {
        padding: '1rem',
        maxWidth: '100%',
        margin: '0',
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
      } : {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
      }}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileNav isAuthenticated={isAuthenticated()} />}
    </div>
  );
}

const navStyle = {
  backgroundColor: '#1da1f2',
  color: 'white',
  padding: '1rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const mobileHeaderStyle = {
  backgroundColor: '#1da1f2',
  color: 'white',
  padding: '1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 100
};

const mobileLogoutButtonStyle = {
  backgroundColor: 'transparent',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  padding: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  borderRadius: '50%',
  transition: 'background-color 0.2s'
};

const linksStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center'
};

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.2s'
};

const userStyle = {
  color: 'white',
  fontWeight: 'bold'
};

const logoutButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'opacity 0.2s'
};

const mainStyle = {
  padding: '2rem',
  maxWidth: '1200px',
  margin: '0 auto'
};

const mobileMainStyle = {
  padding: '1rem',
  maxWidth: '100%',
  margin: '0'
};

const adminLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.2s',
  backgroundColor: '#9b59b6',
  fontWeight: 'bold'
};

export default Layout;