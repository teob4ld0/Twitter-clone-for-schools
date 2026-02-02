import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { repliesAPI, interestSignalsAPI, statusAPI, mediaAPI } from '../services/api';

function Reply({ reply, onDelete, onLikeUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthor = user?.username === reply.author;

  // Avatar
  const [avatarFailed, setAvatarFailed] = useState(false);
  const authorAvatarUrl =
    reply.authorProfilePictureUrl ||
    reply.authorAvatarUrl ||
    reply.avatarUrl ||
    reply.profileImageUrl;
  const showImageAvatar = Boolean(authorAvatarUrl) && !avatarFailed;

  // Estados para likes
  const [isLiked, setIsLiked] = useState(reply.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(reply.likes || 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  // Estado para reposts
  const [isReposted, setIsReposted] = useState(reply.isRepostedByCurrentUser || false);
  const [repostsCount, setRepostsCount] = useState(reply.repostsCount || 0);
  const [isLoadingRepost, setIsLoadingRepost] = useState(false);

  // Estado para el menú desplegable de repost/quote
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const repostMenuRef = useRef(null);
  
  // Estado para el modal de quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [quoteMediaFile, setQuoteMediaFile] = useState(null);
  const [quoteMediaPreview, setQuoteMediaPreview] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const fileInputRef = useRef(null);

  const childrenCount = typeof reply.repliesCount === 'number' ? reply.repliesCount : 0;

  // Efecto para cerrar el menú de repost/quote al hacer clic fuera
  useState(() => {
    const handleClickOutside = (event) => {
      if (repostMenuRef.current && !repostMenuRef.current.contains(event.target)) {
        setShowRepostMenu(false);
      }
    };

    if (showRepostMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showRepostMenu]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Justo ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Hace ${diffInDays}d`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short'
    });
  };

  const handleLike = async () => {
      if (isLoadingLike) return;
  
      const previousIsLiked = isLiked;
      const previousLikesCount = likesCount;
  
      // Actualización optimista
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      setIsLoadingLike(true);
  
      try {
        await repliesAPI.toggleLike(reply.id);
  
        if (onLikeUpdate) {
          // Firma extendida: (replyId, isLiked, likesCount)
          // Compatibilidad: los callers que solo usan 2 args siguen funcionando.
          onLikeUpdate(reply.id, !isLiked, isLiked ? likesCount - 1 : likesCount + 1);
        }
      } catch (error) {
        console.error('Error al dar/quitar like:', error);
        // Revertir cambios si hay error
        setIsLiked(previousIsLiked);
        setLikesCount(previousLikesCount);
        alert('Error al procesar el like. Intenta de nuevo.');
      } finally {
        setIsLoadingLike(false);
      }
    };

  const handleDelete = () => {
    if (window.confirm('¿Eliminar esta respuesta?')) {
      onDelete(reply.id);
    }
  };

  const renderContentWithMentions = (content) => {
    if (!content) return '';

    // Regex para detectar @username#id
    const mentionRegex = /@(\w+)#(\d+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const username = match[1];
      const userId = match[2];
      const displayText = `@${username}`; // Mostrar solo @username, no el #id
      
      parts.push(
        <span
          key={`mention-${match.index}`}
          onClick={(e) => {
            e.stopPropagation();
            // Registrar señal de interés
            interestSignalsAPI.record({
              statusId: reply.id,
              signalType: 'mention_click',
              value: 1,
              metadata: JSON.stringify({ mentionedUsername: username, mentionedUserId: userId })
            }).catch(err => console.error('Error al registrar señal de mention_click:', err));
            navigate(`/perfil/${userId}`);
          }}
          style={mentionStyle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              // Registrar señal de interés
              interestSignalsAPI.record({
                statusId: reply.id,
                signalType: 'mention_click',
                value: 1,
                metadata: JSON.stringify({ mentionedUsername: username, mentionedUserId: userId })
              }).catch(err => console.error('Error al registrar señal de mention_click:', err));
              navigate(`/perfil/${userId}`);
            }
          }}
        >
          {displayText}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const handleRepost = async () => {
    if (isLoadingRepost) return;

    const previousIsReposted = isReposted;
    const previousRepostsCount = repostsCount;

    // Actualización optimista
    setIsReposted(!isReposted);
    setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
    setIsLoadingRepost(true);

    try {
      const res = await repliesAPI.toggleRepost(reply.id);
      if (typeof res?.data?.repostsCount === 'number') {
        setRepostsCount(res.data.repostsCount);
      }
      if (typeof res?.data?.reposted === 'boolean') {
        setIsReposted(res.data.reposted);
      }
    } catch (error) {
      console.error('Error al repostear:', error);
      setIsReposted(previousIsReposted);
      setRepostsCount(previousRepostsCount);
      alert('Error al procesar el repost. Intenta de nuevo.');
    } finally {
      setIsLoadingRepost(false);
    }
  };

  const handleQuote = () => {
    setShowQuoteModal(true);
    setQuoteContent('');
    setQuoteMediaFile(null);
    setQuoteMediaPreview(null);
  };

  const handleQuoteSubmit = async () => {
    if (isLoadingQuote || !quoteContent.trim()) return;

    setIsLoadingQuote(true);

    try {
      let mediaUrl = null;

      if (quoteMediaFile) {
        try {
          const uploadRes = await mediaAPI.upload(quoteMediaFile, 'quotes');
          mediaUrl = uploadRes?.data?.publicUrl || null;
          if (!mediaUrl) {
            throw new Error('No se obtuvo URL del archivo subido');
          }
        } catch (uploadError) {
          console.error('Error al subir media:', uploadError);
          alert('Error al subir el archivo. Intenta de nuevo.');
          setIsLoadingQuote(false);
          return;
        }
      }

      const res = await statusAPI.create({
        content: quoteContent.trim(),
        quotedStatusId: reply.id,
        mediaUrl
      });

      const created = res.data;
      setShowQuoteModal(false);
      setQuoteContent('');
      setQuoteMediaFile(null);
      setQuoteMediaPreview(null);
      if (created?.id) navigate(`/status/${created.id}`);
    } catch (error) {
      console.error('Error al crear quote:', error);
      alert('Error al crear quote. Intenta de nuevo.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de archivo no válido.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 20MB.');
      return;
    }

    setQuoteMediaFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setQuoteMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setQuoteMediaFile(null);
    setQuoteMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenThread = () => {
    // Abrir este comentario como “status” en detalle (como una notificación)
    // para ver sus respuestas sin embole de anidado infinito.
    navigate(`/status/${reply.id}`);
  };

  const renderMedia = (url) => {
    if (!url) return null;
    const lower = String(url).toLowerCase();
    const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.m4v');
    const isImage = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');

    if (isVideo) {
      return <video controls style={mediaStyle} src={url} />;
    }
    if (isImage) {
      return <img alt="media" style={mediaStyle} src={url} />;
    }
    return (
      <a href={url} target="_blank" rel="noreferrer">{url}</a>
    );
  };

  return (
    <div style={commentStyle}>
      <div style={commentHeaderStyle}>
        <div style={avatarSmallStyle}>
        {showImageAvatar ? (
        <img
          alt={reply.author || 'Usuario'}
          src={authorAvatarUrl}
          style={avatarImgStyle}
          onError={() => setAvatarFailed(true)}
        />
      ) : (
          (reply.author?.charAt(0)?.toUpperCase() || '?')
        )}
        </div>
        <div style={commentBodyStyle}>
          <div style={commentInfoStyle}>
            <strong style={authorNameStyle}>{reply.author || 'Usuario'}</strong>
            <span style={dateStyle}>{formatDate(reply.createdAt)}</span>
          </div>
          <p style={contentStyle}>{renderContentWithMentions(reply.content)}</p>

          {reply.mediaUrl && (
            <div style={mediaWrapperStyle}>
              {renderMedia(reply.mediaUrl)}
            </div>
          )}

          <div style={actionsRowStyle}>
            <button
              onClick={handleLike}
              style={{
                ...actionButtonStyle,
                color: isLiked ? '#e0245e' : '#657786'
              }}
              disabled={isLoadingLike}
            >
              <span style={{ fontSize: '1rem' }}>
                {isLiked ? '❤️' : '🤍'}
              </span>
              <span style={{ marginLeft: '0.5rem' }}>
                {likesCount}
              </span>
            </button>

            <div style={{ position: 'relative' }} ref={repostMenuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRepostMenu(!showRepostMenu);
                }}
                style={{
                  ...actionButtonStyle,
                  color: isReposted ? '#17bf63' : '#657786'
                }}
                disabled={isLoadingRepost || isLoadingQuote}
                title="Repost o Quote"
              >
                <span style={{ fontSize: '1.2rem' }}>🔁</span>
                <span style={{ marginLeft: '0.5rem' }}>
                  {repostsCount}
                </span>
              </button>

              {showRepostMenu && (
                <div style={repostMenuStyle}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRepostMenu(false);
                      handleRepost();
                    }}
                    style={menuItemStyle}
                    disabled={isLoadingRepost}
                  >
                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>🔁</span>
                    <span>{isReposted ? 'Deshacer Repost' : 'Repost'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRepostMenu(false);
                      handleQuote();
                    }}
                    style={menuItemStyle}
                    disabled={isLoadingQuote}
                  >
                    <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>📝</span>
                    <span>Quote</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleOpenThread}
              style={actionButtonStyle}
              title="Ver respuestas en el detalle"
            >
              💬
              <span style={{ marginLeft: '0.5rem' }}>
                {childrenCount}
              </span>
            </button>
          </div>
        </div>
        {isAuthor && (
          <button onClick={handleDelete} style={deleteButtonStyle} title="Eliminar">
            🗑️
          </button>
        )}
      </div>

      {/* Modal para escribir quote */}
      {showQuoteModal && (
        <div 
          style={modalOverlayStyle} 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQuoteModal(false);
              setQuoteContent('');
            }
          }}
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>Citar Comentario</h3>
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setQuoteContent('');
                }}
                style={modalCloseButtonStyle}
              >
                ✕
              </button>
            </div>

            <textarea
              value={quoteContent}
              onChange={(e) => setQuoteContent(e.target.value)}
              placeholder="Agrega un comentario..."
              style={quoteTextareaStyle}
              autoFocus
              maxLength={280}
            />

            <div style={charCountStyle}>
              {quoteContent.length}/280
            </div>

            {quoteMediaPreview && (
              <div style={uploadedMediaPreviewStyle}>
                {quoteMediaFile?.type.startsWith('image/') ? (
                  <img src={quoteMediaPreview} alt="Preview" style={uploadedMediaImageStyle} />
                ) : (
                  <video src={quoteMediaPreview} controls style={uploadedMediaImageStyle} />
                )}
                <button
                  onClick={handleRemoveMedia}
                  style={removeMediaButtonStyle}
                  type="button"
                >
                  ✕
                </button>
              </div>
            )}

            <div style={quotedTweetPreviewStyle}>
              <div style={previewHeaderStyle}>
                <span style={{ fontWeight: 'bold' }}>@{reply.author}</span>
                <span style={{ color: '#657786', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                  {formatDate(reply.createdAt)}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                {reply.content}
              </div>
              {reply.mediaUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  {renderMedia(reply.mediaUrl)}
                </div>
              )}
            </div>

            <div style={modalFooterStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov"
                  onChange={handleMediaSelect}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={mediaButtonStyle}
                  disabled={isLoadingQuote || !!quoteMediaFile}
                  type="button"
                  title="Adjuntar imagen o video"
                >
                  <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowQuoteModal(false);
                  setQuoteContent('');
                  setQuoteMediaFile(null);
                  setQuoteMediaPreview(null);
                }}
                style={cancelButtonStyle}
                disabled={isLoadingQuote}
              >
                Cancelar
              </button>
              <button
                onClick={handleQuoteSubmit}
                style={{
                  ...submitButtonStyle,
                  opacity: !quoteContent.trim() || isLoadingQuote ? 0.5 : 1,
                  cursor: !quoteContent.trim() || isLoadingQuote ? 'not-allowed' : 'pointer'
                }}
                disabled={!quoteContent.trim() || isLoadingQuote}
              >
                {isLoadingQuote ? 'Publicando...' : 'Citar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const commentStyle = {
  padding: '12px 0',
  borderBottom: '1px solid #f0f0f0'
};

const commentHeaderStyle = {
  display: 'flex',
  gap: '12px',
  position: 'relative'
};

const avatarSmallStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#1da1f2',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.875rem',
  fontWeight: 'bold',
  flexShrink: 0
};

const avatarImgStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover'
};

const commentBodyStyle = {
  flex: 1,
  minWidth: 0
};

const commentInfoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '4px'
};

const authorNameStyle = {
  fontSize: '0.875rem',
  color: '#14171a'
};

const dateStyle = {
  fontSize: '0.75rem',
  color: '#657786'
};

const contentStyle = {
  fontSize: '0.875rem',
  color: '#14171a',
  margin: '0 0 6px 0',
  lineHeight: '1.4',
  wordBreak: 'break-word'
};

const mediaWrapperStyle = {
  margin: '8px 0'
};

const mediaStyle = {
  maxWidth: '100%',
  borderRadius: '10px',
  border: '1px solid #e1e8ed'
};

const actionButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '0.75rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'background-color 0.2s',
  fontWeight: '500'
};

const actionsRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  flexWrap: 'wrap'
};

const deleteButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1rem',
  cursor: 'pointer',
  opacity: 0.6,
  padding: '4px',
  transition: 'opacity 0.2s',
  position: 'absolute',
  right: 0,
  top: 0
};

const mentionStyle = {
  color: '#1da1f2',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'color 0.2s',
  textDecoration: 'none'
};

const repostMenuStyle = {
  position: 'absolute',
  bottom: '100%',
  left: '0',
  backgroundColor: '#fff',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  minWidth: '200px',
  padding: '4px 0',
  marginBottom: '4px'
};

const menuItemStyle = {
  width: '100%',
  padding: '12px 16px',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: '500',
  color: '#14171a',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '20px'
};

const modalContentStyle = {
  backgroundColor: '#fff',
  borderRadius: '16px',
  maxWidth: '600px',
  width: '100%',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '20px',
  borderBottom: '1px solid #e1e8ed',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const modalCloseButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#657786',
  padding: '4px 8px',
  transition: 'color 0.2s'
};

const quoteTextareaStyle = {
  width: '100%',
  minHeight: '120px',
  padding: '16px 20px',
  fontSize: '1rem',
  border: 'none',
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: '1.5'
};

const charCountStyle = {
  padding: '0 20px 10px',
  textAlign: 'right',
  fontSize: '0.875rem',
  color: '#657786'
};

const uploadedMediaPreviewStyle = {
  position: 'relative',
  margin: '10px 20px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e1e8ed'
};

const uploadedMediaImageStyle = {
  width: '100%',
  maxHeight: '300px',
  objectFit: 'cover',
  display: 'block'
};

const removeMediaButtonStyle = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  background: 'rgba(0, 0, 0, 0.6)',
  color: '#fff',
  border: 'none',
  borderRadius: '50%',
  width: '32px',
  height: '32px',
  cursor: 'pointer',
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s'
};

const quotedTweetPreviewStyle = {
  margin: '10px 20px',
  padding: '12px',
  border: '1px solid #e1e8ed',
  borderRadius: '12px',
  backgroundColor: '#f7f9fa'
};

const previewHeaderStyle = {
  display: 'flex',
  alignItems: 'center'
};

const modalFooterStyle = {
  padding: '16px 20px',
  borderTop: '1px solid #e1e8ed',
  display: 'flex',
  gap: '12px',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const mediaButtonStyle = {
  background: 'none',
  border: '1px solid #1da1f2',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  cursor: 'pointer',
  color: '#1da1f2',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  padding: 0
};

const cancelButtonStyle = {
  padding: '10px 20px',
  border: '1px solid #e1e8ed',
  borderRadius: '20px',
  background: '#fff',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 'bold',
  transition: 'all 0.2s',
  color: '#1da1f2'
};

const submitButtonStyle = {
  padding: '10px 24px',
  border: 'none',
  borderRadius: '20px',
  background: '#1da1f2',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '0.95rem',
  fontWeight: 'bold',
  transition: 'all 0.2s'
};

export default Reply;