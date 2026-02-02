import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import MobileNav from '../components/MobileNav';
import { useState, useEffect } from 'react';

function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ paddingBottom: isMobile ? '70px' : '0' }}>
      {/* Navbar desktop */}
      {!isMobile && (
        <nav style={navStyle}>
          <h2 style={{ margin: 0 }}>Twitetec</h2>
          <div style={linksStyle}>
            <Link to="/" style={linkStyle}>Feed</Link>
            <Link to="/chats" style={linkStyle}>Chats</Link>
            <Link to="/notifications" style={{ ...linkStyle, position: 'relative' }}>
              Notifications
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  borderRadius: '50%',
                  padding: '2px 6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  textAlign: 'center'
                }}>
                  {unreadCount}
                </span>
              )}
            </Link>
            {isAdmin && <Link to="/admin" style={adminLinkStyle}>Admin</Link>}

            {isAuthenticated() ? (
              <>
                <span style={userStyle}>Hola, 
                  <button onClick={() => navigate(`/perfil/${user?.id}`)} style={{ ...linkStyle, padding: 3, background: 'none', border: 'none', cursor: 'pointer' }}>
                    {user?.username}
                  </button>
                </span>
                <button onClick={handleLogout} style={logoutButtonStyle}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={linkStyle}>Login</Link>
                <Link to="/register" style={linkStyle}>Register</Link>
              </>
            )}
          </div>
        </nav>
      )}

      {/* Header mobile */}
      {isMobile && (
        <nav style={mobileHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Twitetec</h2>
          {isAuthenticated() && (
            <button onClick={handleLogout} style={mobileLogoutButtonStyle}>
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </nav>
      )}
      
      <main style={isMobile ? mobileMainStyle : mainStyle}>
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