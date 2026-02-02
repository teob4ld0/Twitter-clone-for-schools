import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

function MobileNav({ isAuthenticated = false }) {
  const location = useLocation();
  const { user } = useAuth();
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
      <nav style={mobileNavStyle}>
        <Link to="/login" style={isActive('/login') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          <span>Login</span>
        </Link>

        <Link to="/register" style={isActive('/register') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
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
    <nav style={mobileNavStyle}>
      <Link to="/" style={isActive('/') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
        <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          <path d="M12 5.5l-4.24 4.24a6 6 0 1 0 8.49 0z"/>
        </svg>
        <span>Feed</span>
      </Link>

      <Link to="/chats" style={isActive('/chats') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
        <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <span>Chats</span>
      </Link>

      <Link to="/notifications" style={isActive('/notifications') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
        <div style={{ position: 'relative' }}>
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span style={badgeStyle}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span>Notif</span>
      </Link>

      {isAdmin && (
        <Link to="/admin" style={isActive('/admin') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
          <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            <path d="M9 11l2 2 4-4"/>
          </svg>
          <span>Admin</span>
        </Link>
      )}

      <Link to={`/perfil/${user?.id || ''}`} style={location.pathname.includes('/perfil/') ? { ...navItemStyle, ...activeItemStyle } : navItemStyle}>
        <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Perfil</span>
      </Link>
    </nav>
  );
}

const mobileNavStyle = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'white',
  borderTop: '1px solid #e1e8ed',
  display: 'flex',
  justifyContent: 'space-around',
  padding: '0.5rem 0',
  zIndex: 1000,
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
};

const navItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.25rem',
  color: '#657786',
  textDecoration: 'none',
  fontSize: '0.75rem',
  padding: '0.5rem 1rem',
  flex: 1,
  transition: 'color 0.2s'
};

const activeItemStyle = {
  color: '#1da1f2',
  fontWeight: 'bold'
};

const iconStyle = {
  width: '24px',
  height: '24px'
};

const badgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '-8px',
  backgroundColor: '#e74c3c',
  color: 'white',
  borderRadius: '10px',
  padding: '2px 6px',
  fontSize: '10px',
  fontWeight: 'bold',
  minWidth: '18px',
  textAlign: 'center'
};

export default MobileNav;
