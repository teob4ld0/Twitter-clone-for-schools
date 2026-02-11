import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';

function MobileNav({ isAuthenticated = false }) {
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const unreadCount = useSelector((state) => state.notification?.unreadCount || 0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar si el usuario es admin (no tiene email de alumno)
    if (user && user.email) {
      const isAdminUser = !user.email.endsWith('@alumno.etec.um.edu.ar');
      setIsAdmin(isAdminUser);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navegación para usuarios no autenticados
  if (!isAuthenticated) {
    return (
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.navbarBackground,
        borderTop: `1px solid ${theme.colors.navbarBorder}`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.5rem 0',
        zIndex: 1000,
        boxShadow: theme.colors.shadowMd,
      }}>
        <Link to="/login" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          color: isActive('/login') ? theme.colors.primary : theme.colors.textSecondary,
          textDecoration: 'none',
          fontSize: '0.75rem',
          padding: '0.5rem 1rem',
          flex: 1,
          transition: 'color 0.2s',
          fontWeight: isActive('/login') ? 'bold' : 'normal',
        }}>
          <svg style={{
            width: '24px',
            height: '24px'
          }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          <span>Login</span>
        </Link>

        <Link to="/register" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          color: isActive('/register') ? theme.colors.primary : theme.colors.textSecondary,
          textDecoration: 'none',
          fontSize: '0.75rem',
          padding: '0.5rem 1rem',
          flex: 1,
          transition: 'color 0.2s',
          fontWeight: isActive('/register') ? 'bold' : 'normal',
        }}>
          <svg style={{
            width: '24px',
            height: '24px'
          }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <span>Registro</span>
        </Link>
      </nav>
    );
  }

  // Navegación para usuarios autenticados
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.navbarBackground,
      borderTop: `1px solid ${theme.colors.navbarBorder}`,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '0.5rem 0',
      zIndex: 1000,
      boxShadow: theme.colors.shadowMd,
    }}>
      <Link to="/" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        color: isActive('/') ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem 1rem',
        flex: 1,
        transition: 'color 0.2s',
        fontWeight: isActive('/') ? 'bold' : 'normal',
      }}>
        <svg style={{
          width: '24px',
          height: '24px'
        }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          <path d="M12 5.5l-4.24 4.24a6 6 0 1 0 8.49 0z"/>
        </svg>
        <span>Feed</span>
      </Link>

      <Link to="/chats" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        color: isActive('/chats') ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem 1rem',
        flex: 1,
        transition: 'color 0.2s',
        fontWeight: isActive('/chats') ? 'bold' : 'normal',
      }}>
        <svg style={{
          width: '24px',
          height: '24px'
        }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span>Chats</span>
      </Link>

      <Link to="/notifications" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        color: isActive('/notifications') ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem 1rem',
        flex: 1,
        transition: 'color 0.2s',
        fontWeight: isActive('/notifications') ? 'bold' : 'normal',
      }}>
        <div style={{ position: 'relative' }}>
          <svg style={{
            width: '24px',
            height: '24px'
          }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-8px',
              backgroundColor: theme.colors.notificationBadge,
              color: theme.colors.notificationBadgeText,
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span>Notif</span>
      </Link>

      {isAdmin && (
        <Link to="/admin" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.25rem',
          color: isActive('/admin') ? theme.colors.primary : theme.colors.textSecondary,
          textDecoration: 'none',
          fontSize: '0.75rem',
          padding: '0.5rem 1rem',
          flex: 1,
          transition: 'color 0.2s',
          fontWeight: isActive('/admin') ? 'bold' : 'normal',
        }}>
          <svg style={{
            width: '24px',
            height: '24px'
          }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            <path d="M9 11l2 2 4-4"/>
          </svg>
          <span>Admin</span>
        </Link>
      )}

      <Link to="/settings" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        color: isActive('/settings') ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem 1rem',
        flex: 1,
        transition: 'color 0.2s',
        fontWeight: isActive('/settings') ? 'bold' : 'normal',
      }}>
        <svg style={{
          width: '24px',
          height: '24px'
        }} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
        </svg>
        <span>Config</span>
      </Link>

      <Link to="/support" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        color: isActive('/support') ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem 1rem',
        flex: 1,
        transition: 'color 0.2s',
        fontWeight: isActive('/support') ? 'bold' : 'normal',
      }}>
        <svg style={{
          width: '24px',
          height: '24px'
        }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
        </svg>
        <span>Soporte</span>
      </Link>

      <Link to={`/perfil/${user?.id || ''}`} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        color: location.pathname.includes('/perfil/') ? theme.colors.primary : theme.colors.textSecondary,
        textDecoration: 'none',
        fontSize: '0.75rem',
        padding: '0.5rem 1rem',
        flex: 1,
        transition: 'color 0.2s',
        fontWeight: location.pathname.includes('/perfil/') ? 'bold' : 'normal',
      }}>
        <svg style={{
          width: '24px',
          height: '24px'
        }} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Perfil</span>
      </Link>
    </nav>
  );
}

export default MobileNav;
