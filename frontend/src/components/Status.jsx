import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { statusAPI, interestSignalsAPI, mediaAPI, reportsAPI } from '../services/api';
import ReplyList from './ReplyList';

function Status({
  status,
  onDelete,
  onLikeUpdate,
  onQuoteCreated,
  initialShowReplies = false,
  focusReplyId = null,
  repostedByUsername = null
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Validación defensiva
  if (!status || !status.id) {
    console.error('Status inválido:', status);
    return null;
  }

  const isAuthor = user?.username === status.author;
  const isRepost = Boolean(status.isRepost);
  const repostLabel = isRepost? `Reposteado${repostedByUsername ? ` por ${repostedByUsername}` : ''}` : null;

  // Estado para likes
  const [isLiked, setIsLiked] = useState(status.isLikedByCurrentUser || false);
  const [likesCount, setLikesCount] = useState(status.likes || 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  // Estado para reposts
  const [isReposted, setIsReposted] = useState(status.isRepostedByCurrentUser || false);
  const [repostsCount, setRepostsCount] = useState(status.repostsCount || 0);
  const [isLoadingRepost, setIsLoadingRepost] = useState(false);

  // Estado para quotes
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

  // Estado para el menú desplegable de repost/quote
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const repostMenuRef = useRef(null);
  
  // Estado para el modal de quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteContent, setQuoteContent] = useState('');
  const [quoteMediaFile, setQuoteMediaFile] = useState(null);
  const [quoteMediaPreview, setQuoteMediaPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Estado para modal de confirmación de borrado
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estado para el menú de opciones (tres puntos)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const optionsMenuRef = useRef(null);

  // Estado para el modal de reporte
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // 'status' | 'user'
  const [selectedReason, setSelectedReason] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Estado para respuestas
  const [showReplies, setShowReplies] = useState(initialShowReplies);
  const [repliesCount, setRepliesCount] = useState(status.repliesCount ?? 0);

  // Estado para hover del nombre del autor
  const [isAuthorHovered, setIsAuthorHovered] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Referencias para tracking de tiempo de visualización
  const statusRef = useRef(null);
  const viewStartTimeRef = useRef(null);
  const totalViewTimeRef = useRef(0);
  const hasRecordedSignalRef = useRef(false);

  const authorInitial = status.author ? status.author.charAt(0).toUpperCase() : '?';
  const authorAvatarUrl = status.authorProfilePictureUrl;
  const showImageAvatar = Boolean(authorAvatarUrl) && !avatarFailed;

  // Efecto para tracking de tiempo de visualización usando Intersection Observer
  useEffect(() => {
    if (!statusRef.current || !user) return;

    const recordViewTime = async (timeInMs) => {
      // Solo registrar si el tiempo es mayor a 1 segundo
      if (timeInMs < 1000 || hasRecordedSignalRef.current) return;

      try {
        await interestSignalsAPI.record({
          statusId: status.id,
          signalType: 'view_time',
          value: Math.floor(timeInMs)
        });
        hasRecordedSignalRef.current = true;
        console.log(`Señal registrada: ${Math.floor(timeInMs)}ms en status ${status.id}`);
      } catch (error) {
        console.error('Error al registrar señal de visualización:', error);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // El post entró en el viewport
            viewStartTimeRef.current = Date.now();
          } else {
            // El post salió del viewport
            if (viewStartTimeRef.current) {
              const viewDuration = Date.now() - viewStartTimeRef.current;
              totalViewTimeRef.current += viewDuration;
              viewStartTimeRef.current = null;

              // Registrar señal si acumuló tiempo suficiente
              if (totalViewTimeRef.current >= 1000 && !hasRecordedSignalRef.current) {
                recordViewTime(totalViewTimeRef.current);
              }
            }
          }
        });
      },
      {
        threshold: 0.5, // 50% del componente visible
        rootMargin: '0px'
      }
    );

    observer.observe(statusRef.current);

    // Cleanup: registrar tiempo acumulado al desmontar
    return () => {
      if (statusRef.current) {
        observer.unobserve(statusRef.current);
      }
      
      // Si estaba visible al desmontar, sumar el tiempo actual
      if (viewStartTimeRef.current) {
        const viewDuration = Date.now() - viewStartTimeRef.current;
        totalViewTimeRef.current += viewDuration;
      }

      // Registrar tiempo total acumulado
      if (totalViewTimeRef.current >= 1000 && !hasRecordedSignalRef.current) {
        recordViewTime(totalViewTimeRef.current);
      }
    };
  }, [status.id, user]);

  // Efecto para cerrar el menú de repost/quote al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
    };
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showOptionsMenu]);

  // Efecto para cerrar el menú de repost/quote al hacer clic fuera
  useEffect(() => {
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
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace unos minutos';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    if (diffInHours < 48) return 'Ayer';
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleOpenReportModal = (target) => {
    setReportTarget(target);
    setSelectedReason(null);
    setReportSuccess(false);
    setShowOptionsMenu(false);
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason || isSubmittingReport) return;
    setIsSubmittingReport(true);
    try {
      await reportsAPI.create({
        statusId: reportTarget === 'status' ? status.id : null,
        otherUserId: reportTarget === 'user' ? status.authorId : null,
        type: selectedReason
      });
      setReportSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar el reporte.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    onDelete(status.id);
  };

  const handleOpenThread = () => {
    // Abrir este status en detalle cuando se haga clic
    navigate(`/status/${status.id}`);
  };

  const shouldOpenThreadFromEvent = (e) => {
    const target = e.target;
    if (!target || typeof target.closest !== 'function') return true;

    // Evitar abrir el thread si se clickea un elemento interactivo dentro del card
    // o una sección marcada explícitamente.
    const interactiveSelector =
      'button, a, input, textarea, select, option, label, video, audio, [data-no-thread="true"]';
    return !target.closest(interactiveSelector);
  };

  const handleCardClick = (e) => {
    if (!shouldOpenThreadFromEvent(e)) return;
    handleOpenThread();
  };

  const handleCardKeyDown = (e) => {
    // Accesibilidad: abrir con Enter o Space cuando el card tiene foco.
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (!shouldOpenThreadFromEvent(e)) return;
    e.preventDefault();
    handleOpenThread();
  };

  const handleLike = async () => {
    if (isLoadingLike) return;

    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    const isGivingLike = !isLiked; // true si está dando like, false si quita like

    // Actualización optimista
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    setIsLoadingLike(true);

    try {
      await statusAPI.toggleLike(status.id);

      // Registrar señal de interés solo cuando se DA like (no cuando se quita)
      if (isGivingLike) {
        try {
          await interestSignalsAPI.record({
            statusId: status.id,
            signalType: 'like',
            value: 1,
            metadata: JSON.stringify({ action: 'like' })
          });
          console.log(`✅ Señal de LIKE registrada en status ${status.id}`);
        } catch (signalError) {
          console.error('Error al registrar señal de like:', signalError);
          // No revertimos el like si falla la señal, solo loggeamos
        }
      }

      if (onLikeUpdate) {
        onLikeUpdate(status.id, !isLiked);
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

  const handleRepost = async () => {
    if (isLoadingRepost) return;

    const previousIsReposted = isReposted;
    const previousRepostsCount = repostsCount;
    const isGivingRepost = !isReposted; // true si está repostando, false si quita repost

    setIsReposted(!isReposted);
    setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
    setIsLoadingRepost(true);

    try {
      const res = await statusAPI.toggleRepost(status.id);

      if (isGivingRepost) {
        try {
          await interestSignalsAPI.record({
            statusId: status.id,
            signalType: 'repost',
            value: 1,
            metadata: JSON.stringify({ action: 'repost' })
          });
          console.log(`✅ Señal de REPOST registrada en status ${status.id}`);
        } catch (signalError) {
          console.error('Error al registrar señal de repost:', signalError);
          // No revertimos el repost si falla la señal, solo loggeamos
        }
      }

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

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y videos (MP4, WEBM, MOV).');
      return;
    }

    // Validar tamaño (20MB máximo)
    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 20MB.');
      return;
    }

    setQuoteMediaFile(file);

    // Crear preview
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

  const handleQuoteSubmit = async () => {
    if (isLoadingQuote || !quoteContent.trim()) return;

    setIsLoadingQuote(true);

    // Registrar señal de interés (best-effort; no bloquea el flujo)
    try {
      await interestSignalsAPI.record({
        statusId: status.id,
        signalType: 'quote',
        value: 1,
        metadata: JSON.stringify({
          contentLength: quoteContent.length,
          hasMedia: !!quoteMediaFile
        })
      });
      console.log(`✅ Señal de QUOTE registrada en status ${status.id}`);
    } catch (signalError) {
      console.error('Error al registrar señal de quote:', signalError);
      // No bloqueamos el flujo si falla la señal
    }

    try {
      let mediaUrl = null;

      // Subir media si hay archivo
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
        quotedStatusId: status.id,
        mediaUrl
      });

      const created = res.data;
      setShowQuoteModal(false);
      setQuoteContent('');
      setQuoteMediaFile(null);
      setQuoteMediaPreview(null);
      if (onQuoteCreated) onQuoteCreated(created);
      if (created?.id) navigate(`/status/${created.id}`);
    } catch (error) {
      console.error('Error al crear quote:', error);
      alert('Error al crear quote. Intenta de nuevo.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const handleAuthorClick = () => {
    if (status.authorId) {
      navigate(`/perfil/${status.authorId}`);
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
      // Agregar texto antes de la mención
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      // Agregar la mención como link
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
              statusId: status.id,
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
                statusId: status.id,
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

    // Agregar el texto restante
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  const renderMedia = (url) => {
    if (!url) return null;
    const lower = String(url).toLowerCase();
    const isVideo = lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.m4v');
    const isImage = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');

    if (isVideo) {
      return (
        <video controls style={mediaStyle} src={url} />
      );
    }
    if (isImage) {
      return (
        <img alt="media" style={mediaStyle} src={url} />
      );
    }

    return (
      <a href={url} target="_blank" rel="noreferrer">{url}</a>
    );
  };

  // Style definitions using theme colors
  const postCardStyle = {
    backgroundColor: theme.colors.cardBackground,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1rem',
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
    outline: 'none'
  };

  const postHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem'
  };

  const repostBannerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: theme.colors.textSecondary,
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '0.75rem'
  };

  const repostIconStyle = {
    fontSize: '1rem',
    lineHeight: 1
  };

  const repostTextStyle = {
    lineHeight: 1
  };

  const authorInfoStyle = {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  };

  const avatarStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: theme.colors.primary,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    flexShrink: 0
  };

  const avatarImgStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary,
    flexShrink: 0
  };

  const authorButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
    transition: 'color 0.2s',
    fontFamily: 'inherit',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%'
  };

  const dateStyle = {
    fontSize: '0.875rem',
    color: theme.colors.textSecondary,
    marginTop: '0.25rem'
  };

  const contentStyle = {
    fontSize: '1rem',
    lineHeight: '1.5',
    color: theme.colors.textPrimary,
    marginBottom: '1rem',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word'
  };

  const mediaWrapperStyle = {
    marginTop: '0.75rem',
    marginBottom: '1rem'
  };

  const mediaStyle = {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '10px',
    border: `1px solid ${theme.colors.border}`,
    display: 'block'
  };

  const footerStyle = {
    display: 'flex',
    gap: '1.5rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.colors.border}`,
    alignItems: 'center',
    flexWrap: 'wrap'
  };

  const quoteCardStyle = {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '10px',
    padding: '0.85rem',
    marginBottom: '1rem',
    backgroundColor: theme.colors.cardBackgroundHover,
    cursor: 'pointer'
  };

  const deletedQuoteCardStyle = {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '10px',
    padding: '0.85rem',
    marginBottom: '1rem',
    backgroundColor: theme.colors.cardBackgroundHover,
    opacity: 0.6
  };

  const deletedQuoteTextStyle = {
    fontSize: '0.875rem',
    fontStyle: 'italic',
    color: theme.colors.textSecondary
  };

  const quoteHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    minWidth: 0
  };

  const quoteBadgeStyle = {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: theme.colors.primary,
    flexShrink: 0
  };

  const quoteAuthorStyle = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: theme.colors.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0
  };

  const quoteDateStyle = {
    fontSize: '0.75rem',
    color: theme.colors.textSecondary,
    marginLeft: 'auto',
    flexShrink: 0
  };

  const quoteContentStyle = {
    fontSize: '0.95rem',
    color: theme.colors.textPrimary,
    lineHeight: 1.4,
    wordBreak: 'break-word'
  };

  const actionButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '0.875rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s, transform 0.1s',
    fontWeight: '500',
    minHeight: '44px',
    minWidth: '44px',
    justifyContent: 'center'
  };

  const deleteButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    minHeight: '44px',
    minWidth: '44px',
    padding: '0.5rem',
    flexShrink: 0
  };

  const mentionStyle = {
    color: theme.colors.primary,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
      color: theme.colors.primaryDark
    }
  };

  const repostMenuStyle = {
    position: 'absolute',
    bottom: '100%',
    left: '0',
    marginBottom: '0.5rem',
    backgroundColor: theme.colors.cardBackground,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
    minWidth: '180px',
    overflow: 'hidden'
  };

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: theme.colors.cardBackground,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: theme.colors.textPrimary,
    transition: 'background-color 0.2s',
    textAlign: 'left',
    ':hover': {
      backgroundColor: theme.colors.cardBackgroundHover
    }
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: '1rem'
  };

  const modalContentStyle = {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column'
  };

  const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: `1px solid ${theme.colors.border}`
  };

  const modalCloseButtonStyle = {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: theme.colors.textSecondary,
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    transition: 'background-color 0.2s'
  };

  const quoteTextareaStyle = {
    width: '100%',
    minHeight: '120px',
    padding: '1rem 1.5rem',
    fontSize: '1.125rem',
    border: 'none',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    backgroundColor: theme.colors.cardBackground,
    color: theme.colors.textPrimary
  };

  const charCountStyle = {
    padding: '0 1.5rem',
    fontSize: '0.875rem',
    color: theme.colors.textSecondary,
    textAlign: 'right'
  };

  const quotedTweetPreviewStyle = {
    margin: '1rem 1.5rem',
    padding: '1rem',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '12px',
    backgroundColor: theme.colors.cardBackgroundHover
  };

  const previewHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    color: theme.colors.textPrimary
  };

  const modalFooterStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: `1px solid ${theme.colors.border}`
  };

  const cancelButtonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'transparent',
    color: theme.colors.textSecondary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '24px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const submitButtonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  };

  const mediaButtonStyle = {
    padding: '0.5rem',
    backgroundColor: 'transparent',
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    transition: 'background-color 0.2s'
  };

  const uploadedMediaPreviewStyle = {
    margin: '1rem 1.5rem',
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border}`
  };

  const uploadedMediaImageStyle = {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    display: 'block'
  };

  const removeMediaButtonStyle = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s'
  };

  const deleteModalStyle = {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: '16px',
    padding: '2rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)',
    textAlign: 'center'
  };

  const deleteConfirmButtonStyle = {
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.colors.error,
    color: 'white',
    border: 'none',
    borderRadius: '24px',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  return (
    <article
      ref={statusRef}
      style={postCardStyle}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label="Abrir publicación"
    >
      {repostLabel && (
        <div style={repostBannerStyle} title="Reposteado">
          <span style={repostIconStyle}>🔁</span>
          <span style={repostTextStyle}>{repostLabel}</span>
        </div>
      )}

      <div style={postHeaderStyle}>
        <div style={authorInfoStyle}>
      {showImageAvatar ? (
        <img
          alt={status.author || 'Usuario'}
          src={authorAvatarUrl}
          style={avatarImgStyle}
          onError={() => setAvatarFailed(true)}
        />
      ) : (
        <div style={avatarStyle}>
          {authorInitial}
        </div>
      )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAuthorClick();
              }}
              onMouseEnter={() => setIsAuthorHovered(true)}
              onMouseLeave={() => setIsAuthorHovered(false)}
              style={{
                ...authorButtonStyle,
                color: isAuthorHovered ? theme.colors.primary : theme.colors.textPrimary,
                textDecoration: isAuthorHovered ? 'underline' : 'none'
              }}
            >
              {status.author || 'Usuario'}
            </button>
            <div style={dateStyle}>{status.createdAt ? formatDate(status.createdAt) : 'Fecha desconocida'}</div>
          </div>
        </div>

        {/* Menú de opciones (tres puntos) */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={optionsMenuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptionsMenu(!showOptionsMenu);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.4rem 0.5rem',
              borderRadius: '50%',
              fontSize: '1.1rem',
              color: theme.colors.textSecondary,
              minHeight: '36px',
              minWidth: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            title="Más opciones"
            data-no-thread="true"
          >
            ⋯
          </button>

          {showOptionsMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: theme.colors.cardBackground,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: '180px',
                overflow: 'hidden'
              }}
              data-no-thread="true"
            >
              {isAuthor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(false);
                    handleDelete();
                  }}
                  style={{
                    ...menuItemStyle,
                    color: theme.colors.error
                  }}
                >
                  <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🗑️</span>
                  <span>Eliminar</span>
                </button>
              )}
              {!isAuthor && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReportModal('status');
                    }}
                    style={menuItemStyle}
                  >
                    <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🚩</span>
                    <span>Reportar publicación</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReportModal('user');
                    }}
                    style={menuItemStyle}
                  >
                    <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🚩</span>
                    <span>Reportar usuario</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={contentStyle}>
        <p>{renderContentWithMentions(status.content)}</p>
      </div>

    {status.mediaUrl && (
      <div style={mediaWrapperStyle}>
        {renderMedia(status.mediaUrl)}
      </div>
    )}

      {status.quotedStatusId && !status.quotedStatus && (
        <div
          style={deletedQuoteCardStyle}
          data-no-thread="true"
        >
          <div style={quoteHeaderStyle}>
            <span style={quoteBadgeStyle}>Quote</span>
            <span style={deletedQuoteTextStyle}>Post borrado</span>
          </div>
        </div>
      )}

      {status.quotedStatus && (
        <div
          style={quoteCardStyle}
          data-no-thread="true"
          onClick={(e) => {
            e.stopPropagation();
            status.quotedStatusId && navigate(`/status/${status.quotedStatusId}`);
          }}
          title="Ver status citado"
        >
          <div style={quoteHeaderStyle}>
            <span style={quoteBadgeStyle}>Quote</span>
            <span style={quoteAuthorStyle}>@{status.quotedStatus.author}</span>
            <span style={quoteDateStyle}>
              {status.quotedStatus.createdAt ? formatDate(status.quotedStatus.createdAt) : ''}
            </span>
          </div>
          <div style={quoteContentStyle}>
            {renderContentWithMentions(status.quotedStatus.content)}
          </div>

          {status.quotedStatus.mediaUrl && (
            <div style={{ marginTop: 8 }}>
              {renderMedia(status.quotedStatus.mediaUrl)}
            </div>
          )}
        </div>
      )}
      
      <div style={footerStyle}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          style={{
            ...actionButtonStyle,
            color: isLiked ? theme.colors.error : theme.colors.textSecondary
          }}
          disabled={isLoadingLike}
        >
          <span style={{ fontSize: '1.2rem' }}>
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
              color: isReposted ? theme.colors.success : theme.colors.textSecondary
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
            <div style={repostMenuStyle} data-no-thread="true">
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
          onClick={(e) => {
            e.stopPropagation();
            toggleReplies();
          }}
          style={{
            ...actionButtonStyle,
            color: showReplies ? theme.colors.primary : theme.colors.textSecondary
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span style={{ marginLeft: '0.5rem' }}>
            {repliesCount}
          </span>
        </button>
      </div>

      {showReplies && (
        <div
          data-no-thread="true"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ReplyList 
            statusId={status.id}
            initialCount={repliesCount}
            onCountChange={setRepliesCount}
            focusReplyId={focusReplyId}
          />
        </div>
      )}

      {/* Modal de confirmación de borrado */}
      {showDeleteModal && (
        <div 
          style={modalOverlayStyle} 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div style={deleteModalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🗑️</div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: theme.colors.textPrimary }}>¿Eliminar publicación?</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: theme.colors.textSecondary, fontSize: '0.95rem' }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={cancelButtonStyle}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                style={deleteConfirmButtonStyle}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: theme.colors.textPrimary }}>Citar Tweet</h3>
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

            {/* Preview de media subido */}
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

            {/* Preview del tweet citado */}
            <div style={quotedTweetPreviewStyle}>
              <div style={previewHeaderStyle}>
                <span style={{ fontWeight: 'bold', color: theme.colors.textPrimary }}>@{status.author}</span>
                <span style={{ color: theme.colors.textSecondary, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                  {status.createdAt ? formatDate(status.createdAt) : ''}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', marginTop: '0.5rem', color: theme.colors.textPrimary }}>
                {status.content}
              </div>
              {status.mediaUrl && (
                <div style={{ marginTop: '0.5rem' }}>
                  {renderMedia(status.mediaUrl)}
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
      {/* Modal de reporte */}
      {showReportModal && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowReportModal(false); setReportSuccess(false); } }}
        >
          <div style={{ ...deleteModalStyle, maxWidth: '480px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            {reportSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: theme.colors.textPrimary }}>Reporte enviado</h3>
                <p style={{ color: theme.colors.textSecondary, margin: '0 0 1.5rem 0' }}>
                  Gracias. Revisaremos tu reporte a la brevedad.
                </p>
                <button
                  onClick={() => { setShowReportModal(false); setReportSuccess(false); }}
                  style={{ ...submitButtonStyle, padding: '0.75rem 2rem' }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold', color: theme.colors.textPrimary }}>
                    🚩 {reportTarget === 'status' ? 'Reportar publicación' : 'Reportar usuario'}
                  </h3>
                  <button
                    onClick={() => setShowReportModal(false)}
                    style={{ ...modalCloseButtonStyle }}
                  >✕</button>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: theme.colors.textSecondary }}>
                  Selecciona el motivo del reporte:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.25rem' }}>
                  {[
                    { id: 'Violence', label: 'Violencia' },
                    { id: 'Pornography', label: 'Pornografía' },
                    { id: 'Bullying', label: 'Bullying / Acoso' },
                    { id: 'Blackmail', label: 'Extorsión / Chantaje' },
                    { id: 'Stalking', label: 'Acoso / Stalking' },
                    { id: 'Abuse', label: 'Abuso' },
                    { id: 'ScholarDamage', label: 'Daño a instalaciones escolares' },
                    { id: 'DrugUse', label: 'Uso de drogas' },
                    { id: 'AlcoholUse', label: 'Uso de alcohol' },
                    { id: 'SelfHarm', label: 'Autolesiones' },
                    { id: 'Disrespect', label: 'Falta de respeto / Normas escolares' }
                  ].map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${selectedReason === reason.id ? theme.colors.primary : theme.colors.border}`,
                        backgroundColor: selectedReason === reason.id
                          ? `${theme.colors.primary}18`
                          : theme.colors.cardBackground,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: theme.colors.textPrimary,
                        textAlign: 'left',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${selectedReason === reason.id ? theme.colors.primary : theme.colors.border}`,
                        backgroundColor: selectedReason === reason.id ? theme.colors.primary : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s'
                      }} />
                      {reason.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowReportModal(false)} style={cancelButtonStyle}>Cancelar</button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={!selectedReason || isSubmittingReport}
                    style={{
                      ...deleteConfirmButtonStyle,
                      backgroundColor: theme.colors.primary,
                      opacity: !selectedReason || isSubmittingReport ? 0.5 : 1,
                      cursor: !selectedReason || isSubmittingReport ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingReport ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default Status;