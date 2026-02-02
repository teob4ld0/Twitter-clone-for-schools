import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

function AdminPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFollowers, setExpandedFollowers] = useState({});
  const [expandedFollowing, setExpandedFollowing] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
      console.error('Error:', err);
      if (err.response?.status === 403) {
        setError('No tienes permisos de administrador');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFollowers = (userId) => {
    setExpandedFollowers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleFollowing = (userId) => {
    setExpandedFollowing(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleBanUser = async (userId, username, isBanned) => {
    const action = isBanned ? 'desbanear' : 'banear';
    if (!confirm(`¿ Estás seguro de que deseas ${action} a ${username}?`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await adminAPI.banUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || `Error al ${action} usuario`);
      console.error('Error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`⚠️ ¿Estás COMPLETAMENTE seguro de que deseas ELIMINAR PERMANENTEMENTE a ${username}? Esta acción NO se puede deshacer.`)) {
      return;
    }

    try {
      setActionLoading(userId);
      await adminAPI.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
      console.error('Error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const goToProfile = (userId) => {
    navigate(`/perfil/${userId}`);
  };

  if (loading) {
    return <div style={containerStyle}>Cargando usuarios...</div>;
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>{error}</div>
      </div>
    );
  }

  return (
    <div style={isMobile ? mobileContainerStyle : containerStyle}>
      <h1 style={isMobile ? mobileTitleStyle : titleStyle}>Panel de Administración</h1>
      <p style={statsStyle}>Total de usuarios: <strong>{users.length}</strong></p>
      
      <div style={isMobile ? mobileUsersContainerStyle : usersContainerStyle}>
        {users.map((user) => {
          const isStudent = user.email.endsWith('@alumno.etec.um.edu.ar');
          const followersExpanded = expandedFollowers[user.id];
          const followingExpanded = expandedFollowing[user.id];

          return (
            <div key={user.id} style={isMobile ? mobileUserCardStyle : userCardStyle}>
              {/* Header */}
              <div style={userHeaderStyle}>
                <div>
                  <button onClick={() => goToProfile(user.id)} style={usernameButtonStyle}>
                    <h3 style={usernameStyle}>{user.username}</h3>
                  </button>
                  <p style={emailStyle}>{user.email}</p>
                </div>
                <div style={badgesContainerStyle}>
                  {user.banned && <span style={bannedBadgeStyle}>BANEADO</span>}
                  <span style={isStudent ? studentBadgeStyle : adminBadgeStyle}>
                    {isStudent ? 'Estudiante' : 'Admin'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={statsRowStyle}>
                <span><strong>Statuses:</strong> {user.statusesCount}</span>
                <span><strong>Verificado:</strong> {user.emailVerified ? '✓' : '✗'}</span>
                <span><strong>Creado:</strong> {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Followers */}
              <div style={followSectionStyle}>
                <button onClick={() => toggleFollowers(user.id)} style={expandButtonStyle}>
                  {followersExpanded ? '▼' : '▶'} Seguidores ({user.followersCount})
                </button>
                {followersExpanded && (
                  <div style={followListStyle}>
                    {user.followers.length === 0 ? (
                      <span style={emptyStyle}>Sin seguidores</span>
                    ) : (
                      user.followers.map(follower => (
                        <button key={follower.id} onClick={() => goToProfile(follower.id)} style={followItemStyle}>
                          {follower.username} ({follower.email})
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Following */}
              <div style={followSectionStyle}>
                <button onClick={() => toggleFollowing(user.id)} style={expandButtonStyle}>
                  {followingExpanded ? '▼' : '▶'} Siguiendo ({user.followingCount})
                </button>
                {followingExpanded && (
                  <div style={followListStyle}>
                    {user.following.length === 0 ? (
                      <span style={emptyStyle}>No sigue a nadie</span>
                    ) : (
                      user.following.map(followed => (
                        <button key={followed.id} onClick={() => goToProfile(followed.id)} style={followItemStyle}>
                          {followed.username} ({followed.email})
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              {isStudent && (
                <div style={actionsContainerStyle}>
                  <button
                    onClick={() => handleBanUser(user.id, user.username, user.banned)}
                    disabled={actionLoading === user.id}
                    style={user.banned ? unbanButtonStyle : banButtonStyle}
                  >
                    {actionLoading === user.id ? '...' : (user.banned ? 'Desbanear' : 'Banear')}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    disabled={actionLoading === user.id}
                    style={deleteButtonStyle}
                  >
                    {actionLoading === user.id ? '...' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '2rem'
};

const mobileContainerStyle = {
  padding: '1rem'
};

const titleStyle = {
  fontSize: '2rem',
  marginBottom: '1rem',
  color: '#333'
};

const mobileTitleStyle = {
  fontSize: '1.5rem',
  marginBottom: '1rem',
  color: '#333'
};

const statsStyle = {
  fontSize: '1.1rem',
  marginBottom: '2rem',
  color: '#666'
};

const usersContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const mobileUsersContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const userCardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  padding: '1.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const mobileUserCardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  padding: '1rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const userHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #e1e8ed'
};

const usernameButtonStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  textAlign: 'left'
};

const usernameStyle = {
  margin: '0 0 0.25rem 0',
  fontSize: '1.25rem',
  color: '#1da1f2',
  cursor: 'pointer'
};

const emailStyle = {
  margin: 0,
  fontSize: '0.9rem',
  color: '#657786'
};

const badgesContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  justifyContent: 'flex-end'
};

const studentBadgeStyle = {
  padding: '0.25rem 0.5rem',
  backgroundColor: '#3498db',
  color: 'white',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: '500'
};

const adminBadgeStyle = {
  padding: '0.25rem 0.5rem',
  backgroundColor: '#9b59b6',
  color: 'white',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: '500'
};

const bannedBadgeStyle = {
  padding: '0.25rem 0.5rem',
  backgroundColor: '#e74c3c',
  color: 'white',
  borderRadius: '4px',
  fontSize: '0.75rem',
  fontWeight: '500'
};

const statsRowStyle = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1rem',
  fontSize: '0.9rem',
  color: '#657786',
  flexWrap: 'wrap'
};

const followSectionStyle = {
  marginBottom: '0.75rem'
};

const expandButtonStyle = {
  background: 'none',
  border: 'none',
  padding: '0.5rem 0',
  cursor: 'pointer',
  color: '#1da1f2',
  fontSize: '0.95rem',
  fontWeight: '500',
  textAlign: 'left',
  width: '100%'
};

const followListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  marginTop: '0.5rem',
  marginLeft: '1.5rem',
  padding: '0.5rem',
  backgroundColor: '#f7f9fa',
  borderRadius: '4px'
};

const followItemStyle = {
  background: 'none',
  border: 'none',
  padding: '0.25rem',
  cursor: 'pointer',
  color: '#1da1f2',
  fontSize: '0.85rem',
  textAlign: 'left',
  textDecoration: 'underline'
};

const emptyStyle = {
  fontSize: '0.85rem',
  color: '#999',
  fontStyle: 'italic'
};

const actionsContainerStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1rem',
  paddingTop: '1rem',
  borderTop: '1px solid #e1e8ed'
};

const banButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#f39c12',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const unbanButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const deleteButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const errorStyle = {
  padding: '1rem',
  backgroundColor: '#fee',
  color: '#c00',
  borderRadius: '4px'
};

export default AdminPage;
