import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersAPI, statusAPI, followersAPI, repliesAPI, interestSignalsAPI } from '../services/api';
import Status from '../components/Status';
import FollowingButton from '../components/FollowingButton';
import Reply from '../components/Reply';
import { useAuth } from '../context/AuthContext';
import { useDispatch } from 'react-redux';
import { createOrGetChat } from '../store/chatSlice';
import { useIsMobile } from '../hooks/useMobile';

function UserProfile() {
  const { userId } = useParams();  // ← Extrae el parámetro de la URL
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const dispatch = useDispatch();

	const profileUserId = Number.parseInt(String(userId), 10);
	const currentUserId = currentUser?.id != null
		? Number.parseInt(String(currentUser.id), 10)
		: null;
  
  const [user, setUser] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [likes, setLikes] = useState({ statuses: [], replies: [] });
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState('statuses');
  const [mutualFollowers, setMutualFollowers] = useState([]);
  const [openingChat, setOpeningChat] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const isMobile = useIsMobile();

  const isOwnProfile = currentUserId != null && profileUserId === currentUserId;

  const avatarSrc = user?.profilePictureUrl
    ? `${user.profilePictureUrl}${user.profilePictureUrl.includes('?') ? '&' : '?'}v=${avatarVersion}`
    : `https://ui-avatars.com/api/?name=${user?.username || ''}&background=random&size=150`;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obtener información del usuario
        const userResponse = await usersAPI.getById(userId);
        setUser(userResponse.data);
        setFollowersCount(userResponse.data.followersCount || 0);

        // Emitir señal de interés si no es el propio perfil
        if (!isOwnProfile && currentUser) {
          try {
            const metadataObj = {
              viewedUserId: userId,
              viewerUserId: currentUser.id,
              timestamp: new Date().toISOString(),
              source: 'UserProfile'
            };
            await interestSignalsAPI.record({
              statusId: null,
              signalType: 'opening_user_profile',
              value: 1,
              metadata: JSON.stringify(metadataObj)
            });
            console.log('[InterestSignal] Señal opening_user_profile enviada');
          } catch (signalError) {
            console.warn('[InterestSignal] Error al registrar opening_user_profile:', signalError);
          }
        }

        // Obtener estado de follow y seguidores mutuos
        try {
          const followStatus = await followersAPI.getFollowStatus(userId);
          setIsFollowing(followStatus.data.isFollowing);
          setIsMutual(followStatus.data.isMutual || false);
          setFollowsYou(followStatus.data.followsBack || false);

          const mutualData = await followersAPI.getMutualFollowers(userId);
          setMutualFollowers(mutualData.data.mutualFollowers || []);
        } catch (followErr) {
          console.log('No se pudo obtener el estado de follow');
        }

        // Cargar datos según tab activo
        await loadTabData(activeTab);

      } catch (err) {
        console.error('Error:', err);
        setError(err.response?.data?.error || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, activeTab]);

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'statuses':
          const statusesResponse = await statusAPI.getByUser(userId);
          setStatuses(statusesResponse.data);
          break;
        case 'likes':
          const likesResponse = await usersAPI.getLikes(userId);
          setLikes(likesResponse.data);
          break;
        case 'replies':
          const repliesResponse = await usersAPI.getReplies(userId);
          setReplies(repliesResponse.data);
          break;
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
    }
  };

  const handleStatusDelete = (statusId) => {
    setStatuses(statuses.filter(status => status.id !== statusId));
  };

  const handleFollowChange = (newFollowStatus) => {
    setIsFollowing(newFollowStatus);
    setIsMutual(newFollowStatus && followsYou);
    // Actualizar el contador de followers
    setFollowersCount(prev => newFollowStatus ? prev + 1 : prev - 1);
  };

  const updateReplyInLikesState = (replyId, updater) => {
    setLikes(prev => {
      const updatedReplies = (prev.replies || []).map(r => {
        if (r.id !== replyId) return r;
        return updater(r);
      });
      return { ...prev, replies: updatedReplies };
    });
  };

  const updateReplyInRepliesTabState = (replyId, updater) => {
    setReplies(prev => (prev || []).map(r => (r.id === replyId ? updater(r) : r)));
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await repliesAPI.delete(replyId);
      setReplies(prev => (prev || []).filter(r => r.id !== replyId));
      setLikes(prev => ({
        ...prev,
        replies: (prev.replies || []).filter(r => r.id !== replyId)
      }));
    } catch (err) {
      console.error('Error al eliminar la respuesta:', err);
      alert('Error al eliminar la respuesta');
    }
  };

  const handleGoToStatus = (statusId, replyId = null) => {
    if (!statusId) return;
    if (replyId) {
      navigate(`/status/${statusId}?replyId=${replyId}`);
    } else {
      navigate(`/status/${statusId}`);
    }
  };

  const handleSendMessage = async () => {
		const targetUserId = profileUserId;
		if (!targetUserId || !currentUserId || targetUserId === currentUserId) return;
    if (openingChat) return;

    try {
      setOpeningChat(true);
      const chat = await dispatch(createOrGetChat(targetUserId)).unwrap();
      navigate(`/chats?chatId=${chat.id}`);
    } catch (err) {
      console.error('Error opening chat:', err);
      alert('No se pudo abrir el chat');
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return <div style={loadingStyle}>Cargando perfil...</div>;
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} style={buttonStyle}>
          ← Volver al Feed
        </button>
      </div>
    );
  }

  if (!user) {
    return <div style={errorContainerStyle}>Usuario no encontrado</div>;
  }

  const handlePickProfilePicture = () => {
    if (!isOwnProfile) return;
    fileInputRef.current?.click();
  };

  const handleProfilePictureSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingProfilePicture(true);
      const resp = await usersAPI.updateProfilePicture(file);
      const newUrl = resp.data?.profilePictureUrl;
      if (!newUrl) throw new Error('Missing profilePictureUrl');

      setUser(prev => ({ ...prev, profilePictureUrl: newUrl }));
      if (isOwnProfile) updateUser({ profilePictureUrl: newUrl });
      setAvatarVersion(v => v + 1);
    } catch (err) {
      console.error('Error updating profile picture:', err);
      alert('No se pudo actualizar la foto de perfil');
    } finally {
      setUploadingProfilePicture(false);
      // allow selecting the same file again
      e.target.value = '';
    }
  };

  return (
    <div style={isMobile ? mobileContainerStyle : containerStyle}>
      {/* Header del perfil */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
          ← Volver
        </button>
      </div>

      {/* Información del usuario */}
      <div style={isMobile ? mobileProfileCardStyle : profileCardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <img
            src={avatarSrc}
            alt={user.username}
            style={isMobile ? mobileAvatarStyle : avatarStyle}
          />
          {isOwnProfile && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePictureSelected}
                disabled={uploadingProfilePicture}
              />
              <button
                onClick={handlePickProfilePicture}
                disabled={uploadingProfilePicture}
                style={{
                  padding: '8px 14px',
                  borderRadius: 9999,
                  border: '1px solid #1da1f2',
                  background: '#fff',
                  color: '#1da1f2',
                  fontWeight: 700,
                  cursor: uploadingProfilePicture ? 'not-allowed' : 'pointer'
                }}
              >
                {uploadingProfilePicture ? 'Subiendo...' : 'Cambiar foto'}
              </button>
            </>
          )}
        </div>
        <div style={infoStyle}>
          <div style={isMobile ? mobileHeaderRowStyle : headerRowStyle}>
            <div style={nameContainerStyle}>
              <h1 style={isMobile ? mobileNameStyle : nameStyle}>
                {user.username}
                <span style={userIdStyle}>#{user.id}</span>
              </h1>
              {isMutual && (
                <span style={mutualBadgeStyle} title="Se siguen mutuamente">
                  ↔️ Mutual
                </span>
              )}
              {!isMutual && followsYou && !isFollowing && (
                <span style={followsYouBadgeStyle} title="Este usuario te sigue">
                  Te sigue
                </span>
              )}
            </div>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {currentUser?.id && currentUser.id !== parseInt(userId) && (
                  <button
                    onClick={handleSendMessage}
                    disabled={openingChat}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 9999,
                      border: '1px solid #1da1f2',
                      background: '#fff',
                      color: '#1da1f2',
                      fontWeight: 700,
                      cursor: openingChat ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Mensaje
                  </button>
                )}
                <div style={{ minWidth: '120px', maxWidth: '180px' }}>
                  <FollowingButton
                    userId={profileUserId}
                    initialIsFollowing={isFollowing}
                    onFollowChange={handleFollowChange}
                  />
                </div>
              </div>
            )}
          </div>
          {isMobile && currentUser?.id && currentUser.id !== parseInt(userId) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 8 }}>
              <button
                onClick={handleSendMessage}
                disabled={openingChat}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 9999,
                  border: '1px solid #1da1f2',
                  background: '#fff',
                  color: '#1da1f2',
                  fontWeight: 700,
                  cursor: openingChat ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                Mensaje
              </button>
              <div style={{ flex: 1 }}>
                <FollowingButton
                  userId={profileUserId}
                  initialIsFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                />
              </div>
            </div>
          )}
          <p style={statsStyle}>
            📝 {statuses.length} {statuses.length === 1 ? 'estado' : 'estados'} •
            👥 {followersCount} {followersCount === 1 ? 'seguidor' : 'seguidores'}
          </p>
          <p style={dateStyle}>
            Miembro desde {new Date(user.createdAt).toLocaleDateString('es-AR')}
          </p>
          {mutualFollowers.length > 0 && (
            <p style={mutualFollowersStyle}>
              Seguido por{' '}
              {mutualFollowers.map((follower, index) => (
                <span key={follower.id}>
                  <strong>{follower.username}</strong>
                  {index < mutualFollowers.length - 1 && (
                    index === mutualFollowers.length - 2 ? ' y ' : ', '
                  )}
                </span>
              ))}
              {' '}que sigues
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={tabsContainerStyle}>
        <button
          onClick={() => setActiveTab('statuses')}
          style={activeTab === 'statuses' ? activeTabStyle : tabStyle}
        >
          Estados
        </button>
        <button
          onClick={() => setActiveTab('likes')}
          style={activeTab === 'likes' ? activeTabStyle : tabStyle}
        >
          Likes
        </button>
        <button
          onClick={() => setActiveTab('replies')}
          style={activeTab === 'replies' ? activeTabStyle : tabStyle}
        >
          Respuestas
        </button>
      </div>

      {/* Contenido según tab activo */}
      <div style={tabContentStyle}>
        {activeTab === 'statuses' && (
          <div>
            {statuses.length === 0 ? (
              <div style={emptyStateStyle}>
                <p>Este usuario aún no ha publicado nada.</p>
              </div>
            ) : (
              statuses.map(status => (
                <Status
                  key={status.id}
                  status={status}
                  onDelete={handleStatusDelete}
                  repostedByUsername={status.isRepost ? user?.username : null}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'likes' && (
          <div>
            {likes.statuses.length === 0 && likes.replies.length === 0 ? (
              <div style={emptyStateStyle}>
                <p>Este usuario aún no le ha dado like a nada.</p>
              </div>
            ) : (
              // Mezclar estados y respuestas en orden cronológico
              [...likes.statuses.map(s => ({ ...s, type: 'status' })),
               ...likes.replies.map(r => ({ ...r, type: 'reply' }))]
                .sort((a, b) => new Date(b.likedAt) - new Date(a.likedAt))
                .map(item => {
                  if (item.type === 'status') {
                    return <Status key={`status-${item.id}`} status={item} onDelete={() => {}} />;
                  } else {
                    return (
                      <div key={`reply-${item.id}`} style={commentCardStyle}>
                        <div style={commentHeaderStyle}>
                          <div style={commentHeaderLeftStyle}>
                            <span style={commentTypeBadgeStyle}>💬 Respuesta</span>
                          </div>
                          <span style={commentDateStyle}>
                            {new Date(item.createdAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>

                        <Reply
                          reply={item}
                          onDelete={handleDeleteReply}
                          onLikeUpdate={(replyId, isLiked, likesCount) => {
                            updateReplyInLikesState(replyId, r => ({
                              ...r,
                              isLikedByCurrentUser: isLiked,
                              likes: typeof likesCount === 'number' ? likesCount : r.likes
                            }));
                          }}
                        />

                        <button
                          onClick={() => handleGoToStatus(item.parentStatusId, item.id)}
                          style={{
                            ...commentMetaStyle,
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          title="Ver estado"
                        >
                          En respuesta a <strong>{item.parentAuthor}</strong>: "<span style={truncateTextStyle}>{item.parentContent}</span>"
                        </button>
                      </div>
                    );
                  }
                })
            )}
          </div>
        )}

        {activeTab === 'replies' && (
          <div>
            {replies.length === 0 ? (
              <div style={emptyStateStyle}>
                <p>Este usuario aún no ha respondido nada.</p>
              </div>
            ) : (
              replies.map(reply => (
                <div key={reply.id} style={commentCardStyle}>
                  <div style={commentHeaderStyle}>
                    <span style={commentTypeBadgeStyle}>💬 Respuesta</span>
                    <span style={commentDateStyle}>
                      {new Date(reply.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>

                  <Reply
                    reply={reply}
                    onDelete={handleDeleteReply}
                    onLikeUpdate={(replyId, isLiked, likesCount) => {
                      updateReplyInRepliesTabState(replyId, r => ({
                        ...r,
                        isLikedByCurrentUser: isLiked,
                        likes: typeof likesCount === 'number' ? likesCount : r.likes
                      }));
                    }}
                  />

                  <button
                    onClick={() => handleGoToStatus(reply.parentStatusId, reply.id)}
                    style={{
                      ...commentMetaStyle,
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    title="Ver estado"
                  >
                    En respuesta a <strong>{reply.parentAuthor}</strong>: "{reply.parentContent.substring(0, 50)}..."
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Estilos
const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px'
};

const mobileContainerStyle = {
  maxWidth: '100%',
  margin: '0',
  padding: '0.5rem'
};

const mobileProfileCardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e1e8ed',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const mobileAvatarStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  border: '3px solid #f5f8fa'
};

const mobileHeaderRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '8px'
};

const mobileNameStyle = {
  margin: '0',
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#14171a'
};

const headerStyle = {
  marginBottom: '20px'
};

const backButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#1da1f2',
  fontSize: '16px',
  cursor: 'pointer',
  padding: '8px 12px',
  fontWeight: 'bold'
};

const profileCardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e1e8ed',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  display: 'flex',
  gap: '20px',
  alignItems: 'center'
};

const avatarStyle = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  border: '4px solid #f5f8fa'
};

const infoStyle = {
  flex: 1
};

const headerRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const nameContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap',
  flex: 1,
  minWidth: 0
};

const nameStyle = {
  margin: '0',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#14171a'
};

const userIdStyle = {
  fontSize: '16px',
  fontWeight: '400',
  color: '#657786',
  marginLeft: '6px'
};

const mutualBadgeStyle = {
  fontSize: '12px',
  backgroundColor: '#e8f5fe',
  color: '#1da1f2',
  padding: '4px 10px',
  borderRadius: '12px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px'
};

const followsYouBadgeStyle = {
  fontSize: '12px',
  backgroundColor: '#f0f0f0',
  color: '#14171a',
  padding: '4px 10px',
  borderRadius: '12px',
  fontWeight: '600',
  display: 'inline-flex',
  alignItems: 'center'
};

const emailStyle = {
  color: '#657786',
  margin: '0 0 12px 0'
};

const statsStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#14171a',
  margin: '8px 0'
};

const dateStyle = {
  color: '#657786',
  fontSize: '14px',
  margin: '4px 0'
};

const mutualFollowersStyle = {
  color: '#657786',
  fontSize: '13px',
  margin: '8px 0 0 0',
  fontWeight: '400'
};

const tabsContainerStyle = {
  display: 'flex',
  borderBottom: '1px solid #e1e8ed',
  marginBottom: '20px'
};

const tabStyle = {
  flex: 1,
  padding: '16px',
  background: 'none',
  border: 'none',
  fontSize: '15px',
  fontWeight: '600',
  color: '#657786',
  cursor: 'pointer',
  borderBottom: '2px solid transparent',
  transition: 'all 0.2s'
};

const activeTabStyle = {
  flex: 1,
  padding: '16px',
  background: 'none',
  border: 'none',
  fontSize: '15px',
  fontWeight: '600',
  color: '#1da1f2',
  cursor: 'pointer',
  borderBottom: '2px solid #1da1f2',
  transition: 'all 0.2s'
};

const tabContentStyle = {
  minHeight: '200px'
};

const emptyStateStyle = {
  backgroundColor: '#f7f9fa',
  padding: '40px',
  textAlign: 'center',
  borderRadius: '12px',
  color: '#657786'
};

const sectionTitleStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '16px',
  color: '#14171a'
};

const commentCardStyle = {
  backgroundColor: 'white',
  border: '1px solid #e1e8ed',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '12px'
};

const commentHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const commentHeaderLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1
};

const commentTypeBadgeStyle = {
  fontSize: '12px',
  backgroundColor: '#e8f5fe',
  color: '#1da1f2',
  padding: '2px 8px',
  borderRadius: '12px',
  fontWeight: '600'
};

const commentDateStyle = {
  fontSize: '14px',
  color: '#657786'
};

const commentContentStyle = {
  margin: '8px 0',
  fontSize: '15px',
  color: '#14171a',
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  wordBreak: 'break-word'
};

const truncateTextStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-word'
};

const commentMetaStyle = {
  fontSize: '13px',
  color: '#657786',
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: '1px solid #f0f0f0'
};

const commentStatsStyle = {
  fontSize: '14px',
  color: '#657786',
  marginTop: '8px'
};

const loadingStyle = {
  textAlign: 'center',
  padding: '40px',
  fontSize: '18px',
  color: '#657786'
};

const errorContainerStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#e0245e'
};

const buttonStyle = {
  padding: '12px 24px',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '9999px',
  fontSize: '15px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '16px'
};

export default UserProfile;