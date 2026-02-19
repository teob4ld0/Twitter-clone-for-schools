import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, reportsAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function AdminPage() {
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedFollowers, setExpandedFollowers] = useState({});
  const [expandedFollowing, setExpandedFollowing] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [deletedStatuses, setDeletedStatuses] = useState([]);
  const [deletedMessages, setDeletedMessages] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);
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

  const loadDeletedStatuses = async () => {
    try {
      setDeletedLoading(true);
      const response = await adminAPI.getDeletedStatuses();
      setDeletedStatuses(response.data);
    } catch (err) {
      console.error('Error loading deleted statuses:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const loadDeletedMessages = async () => {
    try {
      setDeletedLoading(true);
      const response = await adminAPI.getDeletedMessages();
      setDeletedMessages(response.data);
    } catch (err) {
      console.error('Error loading deleted messages:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const response = await reportsAPI.getAll({ pageSize: 100 });
      setReports(response.data.data || []);
      setReportsTotalCount(response.data.total || 0);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'deletedStatuses' && deletedStatuses.length === 0) {
      loadDeletedStatuses();
    } else if (activeTab === 'deletedMessages' && deletedMessages.length === 0) {
      loadDeletedMessages();
    } else if (activeTab === 'reports' && reports.length === 0) {
      loadReports();
    }
  }, [activeTab]);

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
    return <div style={{ ...containerStyle, backgroundColor: theme.colors.cardBackground, color: theme.colors.textPrimary }}>Cargando usuarios...</div>;
  }

  if (error) {
    return (
      <div style={{ ...containerStyle, backgroundColor: theme.colors.cardBackground }}>
        <div style={{ ...errorStyle, backgroundColor: theme.colors.errorLight, color: theme.colors.error }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={isMobile ? { ...mobileContainerStyle, backgroundColor: theme.colors.background, color: theme.colors.textPrimary } : { ...containerStyle, backgroundColor: theme.colors.background, color: theme.colors.textPrimary }}>
      <h1 style={isMobile ? { ...mobileTitleStyle, color: theme.colors.textPrimary } : { ...titleStyle, color: theme.colors.textPrimary }}>Panel de Administración</h1>

      {/* Tabs */}
      <div style={tabBarStyle}>
        <button
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? { ...tabStyle, ...activeTabStyle, borderColor: theme.colors.primary, color: theme.colors.primary } : { ...tabStyle, color: theme.colors.textSecondary }}
        >
          👥 Usuarios ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('deletedStatuses')}
          style={activeTab === 'deletedStatuses' ? { ...tabStyle, ...activeTabStyle, borderColor: theme.colors.primary, color: theme.colors.primary } : { ...tabStyle, color: theme.colors.textSecondary }}
        >
          🗑️ Statuses eliminados
        </button>
        <button
          onClick={() => setActiveTab('deletedMessages')}
          style={activeTab === 'deletedMessages' ? { ...tabStyle, ...activeTabStyle, borderColor: theme.colors.primary, color: theme.colors.primary } : { ...tabStyle, color: theme.colors.textSecondary }}
        >
          💬 Mensajes eliminados
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          style={activeTab === 'reports' ? { ...tabStyle, ...activeTabStyle, borderColor: theme.colors.primary, color: theme.colors.primary } : { ...tabStyle, color: theme.colors.textSecondary }}
        >
          🚩 Reportes {reportsTotalCount > 0 ? `(${reportsTotalCount})` : ''}
        </button>
      </div>

      {/* Tab: Deleted Statuses */}
      {activeTab === 'deletedStatuses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ ...statsStyle, color: theme.colors.textPrimary, margin: 0 }}>
              Total: <strong>{deletedStatuses.length}</strong> statuses eliminados
            </p>
            <button onClick={loadDeletedStatuses} style={{ ...banButtonStyle, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              🔄 Refrescar
            </button>
          </div>
          {deletedLoading ? (
            <div style={{ color: theme.colors.textSecondary }}>Cargando...</div>
          ) : deletedStatuses.length === 0 ? (
            <div style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No hay statuses eliminados</div>
          ) : (
            <div style={isMobile ? mobileUsersContainerStyle : usersContainerStyle}>
              {deletedStatuses.map((status) => (
                <div key={status.id} style={isMobile ? { ...mobileUserCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border } : { ...userCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }}>
                  <div style={userHeaderStyle}>
                    <div>
                      <button onClick={() => goToProfile(status.authorId)} style={{ ...usernameButtonStyle, color: theme.colors.link }}>
                        <h3 style={{ ...usernameStyle, color: theme.colors.textPrimary, fontSize: '1rem' }}>@{status.author}</h3>
                      </button>
                      <p style={{ ...emailStyle, color: theme.colors.textSecondary }}>ID del status: {status.id}</p>
                    </div>
                    <span style={{ ...bannedBadgeStyle, backgroundColor: '#95a5a6' }}>ELIMINADO</span>
                  </div>
                  <p style={{ color: theme.colors.textPrimary, marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{status.content}</p>
                  {status.mediaUrl && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <a href={status.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.link, fontSize: '0.85rem' }}>📎 Ver media adjunto</a>
                    </div>
                  )}
                  <div style={{ ...statsRowStyle, color: theme.colors.textSecondary }}>
                    <span><strong>Creado:</strong> {new Date(status.createdAt).toLocaleString()}</span>
                    <span><strong>Eliminado:</strong> {new Date(status.deletedAt).toLocaleString()}</span>
                    {status.parentStatusId && <span><strong>Respuesta a:</strong> #{status.parentStatusId}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Deleted Messages */}
      {activeTab === 'deletedMessages' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ ...statsStyle, color: theme.colors.textPrimary, margin: 0 }}>
              Total: <strong>{deletedMessages.length}</strong> mensajes eliminados
            </p>
            <button onClick={loadDeletedMessages} style={{ ...banButtonStyle, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              🔄 Refrescar
            </button>
          </div>
          {deletedLoading ? (
            <div style={{ color: theme.colors.textSecondary }}>Cargando...</div>
          ) : deletedMessages.length === 0 ? (
            <div style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No hay mensajes eliminados</div>
          ) : (
            <div style={isMobile ? mobileUsersContainerStyle : usersContainerStyle}>
              {deletedMessages.map((msg) => (
                <div key={msg.id} style={isMobile ? { ...mobileUserCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border } : { ...userCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }}>
                  <div style={userHeaderStyle}>
                    <div>
                      <h3 style={{ ...usernameStyle, color: theme.colors.textPrimary, fontSize: '1rem', margin: 0 }}>@{msg.senderUsername}</h3>
                      <p style={{ ...emailStyle, color: theme.colors.textSecondary }}>Chat #{msg.chatId} • Mensaje #{msg.id}</p>
                    </div>
                    <span style={{ ...bannedBadgeStyle, backgroundColor: '#95a5a6' }}>ELIMINADO</span>
                  </div>
                  <p style={{ color: theme.colors.textPrimary, marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{msg.content || '(sin texto)'}</p>
                  {msg.mediaUrl && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.link, fontSize: '0.85rem' }}>📎 Ver media adjunto</a>
                    </div>
                  )}
                  <div style={{ ...statsRowStyle, color: theme.colors.textSecondary }}>
                    <span><strong>Enviado:</strong> {new Date(msg.createdAt).toLocaleString()}</span>
                    <span><strong>Eliminado:</strong> {new Date(msg.deletedAt).toLocaleString()}</span>
                    <span><strong>Entre usuarios:</strong> #{msg.chatUser1Id} ↔ #{msg.chatUser2Id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Users (original) */}
      {activeTab === 'users' && (
        <div>
      <p style={{ ...statsStyle, color: theme.colors.textPrimary }}>Total de usuarios: <strong>{users.length}</strong></p>
      
      <div style={isMobile ? mobileUsersContainerStyle : usersContainerStyle}>
        {users.map((user) => {
          const isStudent = user.email.endsWith('@alumno.etec.um.edu.ar');
          const followersExpanded = expandedFollowers[user.id];
          const followingExpanded = expandedFollowing[user.id];

          return (
            <div key={user.id} style={isMobile ? { ...mobileUserCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border } : { ...userCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }}>
              {/* Header */}
              <div style={userHeaderStyle}>
                <div>
                  <button onClick={() => goToProfile(user.id)} style={{ ...usernameButtonStyle, color: theme.colors.link }}>
                    <h3 style={{ ...usernameStyle, color: theme.colors.textPrimary }}>{user.username}</h3>
                  </button>
                  <p style={{ ...emailStyle, color: theme.colors.textSecondary }}>{user.email}</p>
                </div>
                <div style={badgesContainerStyle}>
                  {user.banned && <span style={bannedBadgeStyle}>BANEADO</span>}
                  <span style={isStudent ? studentBadgeStyle : adminBadgeStyle}>
                    {isStudent ? 'Estudiante' : 'Admin'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ ...statsRowStyle, color: theme.colors.textSecondary }}>
                <span><strong>Statuses:</strong> {user.statusesCount}</span>
                <span><strong>Verificado:</strong> {user.emailVerified ? '✓' : '✗'}</span>
                <span><strong>Creado:</strong> {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Followers */}
              <div style={followSectionStyle}>
                <button onClick={() => toggleFollowers(user.id)} style={{ ...expandButtonStyle, color: theme.colors.link }}>
                  {followersExpanded ? '▼' : '▶'} Seguidores ({user.followersCount})
                </button>
                {followersExpanded && (
                  <div style={{ ...followListStyle, backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.textPrimary }}>
                    {user.followers.length === 0 ? (
                      <span style={{ ...emptyStyle, color: theme.colors.textTertiary }}>Sin seguidores</span>
                    ) : (
                      user.followers.map(follower => (
                        <button key={follower.id} onClick={() => goToProfile(follower.id)} style={{ ...followItemStyle, color: theme.colors.link }}>
                          {follower.username} ({follower.email})
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Following */}
              <div style={followSectionStyle}>
                <button onClick={() => toggleFollowing(user.id)} style={{ ...expandButtonStyle, color: theme.colors.link }}>
                  {followingExpanded ? '▼' : '▶'} Siguiendo ({user.followingCount})
                </button>
                {followingExpanded && (
                  <div style={{ ...followListStyle, backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.textPrimary }}>
                    {user.following.length === 0 ? (
                      <span style={{ ...emptyStyle, color: theme.colors.textTertiary }}>No sigue a nadie</span>
                    ) : (
                      user.following.map(followed => (
                        <button key={followed.id} onClick={() => goToProfile(followed.id)} style={{ ...followItemStyle, color: theme.colors.link }}>
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
      )}
      {/* Tab: Reports */}
      {activeTab === 'reports' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ ...statsStyle, color: theme.colors.textPrimary, margin: 0 }}>
              Total: <strong>{reportsTotalCount}</strong> reportes
            </p>
            <button onClick={loadReports} style={{ ...banButtonStyle, fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              🔄 Refrescar
            </button>
          </div>
          {reportsLoading ? (
            <div style={{ color: theme.colors.textSecondary }}>Cargando reportes...</div>
          ) : reports.length === 0 ? (
            <div style={{ color: theme.colors.textSecondary, fontStyle: 'italic' }}>No hay reportes aún</div>
          ) : (
            <div style={isMobile ? mobileUsersContainerStyle : usersContainerStyle}>
              {reports.map((report) => (
                <div
                  key={report.id}
                  style={isMobile
                    ? { ...mobileUserCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }
                    : { ...userCardStyle, backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }}
                >
                  {/* Header */}
                  <div style={userHeaderStyle}>
                    <div>
                      <span style={{ ...bannedBadgeStyle, backgroundColor: '#e67e22', fontSize: '0.8rem' }}>
                        🚩 {report.type}
                      </span>
                      <p style={{ ...emailStyle, color: theme.colors.textSecondary, marginTop: '0.35rem' }}>
                        Reporte #{report.id}
                      </p>
                    </div>
                    <span style={{ ...emailStyle, color: theme.colors.textSecondary, fontSize: '0.8rem' }}>
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Reportador */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {report.reporter.profilePictureUrl
                      ? <img src={report.reporter.profilePictureUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: theme.colors.primary + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 'bold', color: theme.colors.primary }}>{report.reporter.username?.[0]?.toUpperCase()}</div>
                    }
                    <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                      <strong>Reportador:</strong>{' '}
                      <button onClick={() => goToProfile(report.reporter.id)} style={{ ...usernameButtonStyle, color: theme.colors.link, fontSize: '0.9rem' }}>
                        @{report.reporter.username}
                      </button>
                      <span style={{ fontSize: '0.8rem', marginLeft: '0.25rem', color: theme.colors.textSecondary }}>({report.reporter.email})</span>
                    </span>
                  </div>

                  {/* Contenido reportado */}
                  {report.reportedUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {report.reportedUser.profilePictureUrl
                        ? <img src={report.reportedUser.profilePictureUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#e67e2233', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#e67e22' }}>{report.reportedUser.username?.[0]?.toUpperCase()}</div>
                      }
                      <span style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>
                        <strong>Usuario reportado:</strong>{' '}
                        <button onClick={() => goToProfile(report.reportedUser.id)} style={{ ...usernameButtonStyle, color: theme.colors.link, fontSize: '0.9rem' }}>
                          @{report.reportedUser.username}
                        </button>
                        <span style={{ fontSize: '0.8rem', marginLeft: '0.25rem', color: theme.colors.textSecondary }}>({report.reportedUser.email})</span>
                      </span>
                    </div>
                  )}
                  {report.statusId && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <strong style={{ color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
                          Publicación reportada:
                        </strong>
                        {report.statusAuthor && (
                          <button
                            onClick={() => goToProfile(report.statusAuthor.id)}
                            style={{ ...usernameButtonStyle, color: theme.colors.link, fontSize: '0.85rem' }}
                          >
                            @{report.statusAuthor.username}
                          </button>
                        )}
                      </div>
                      {report.statusContent && (
                        <button
                          onClick={() => navigate(`/status/${report.statusId}`)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            margin: 0,
                            padding: '0.65rem 0.85rem',
                            backgroundColor: theme.colors.backgroundSecondary || theme.colors.cardBackgroundHover,
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: theme.colors.textPrimary,
                            whiteSpace: 'pre-wrap',
                            border: `1px solid ${theme.colors.border}`,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'opacity 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          {report.statusContent}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: theme.colors.link, marginTop: '0.35rem' }}>
                            Ver publicación →
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

const tabBarStyle = {
  display: 'flex',
  gap: '0',
  marginBottom: '1.5rem',
  borderBottom: '2px solid #e1e8ed'
};

const tabStyle = {
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  padding: '0.75rem 1.25rem',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: '500',
  marginBottom: '-2px',
  transition: 'all 0.2s'
};

const activeTabStyle = {
  borderBottom: '2px solid currentColor',
  fontWeight: '600'
};

export default AdminPage;
