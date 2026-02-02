import { useState, useEffect } from 'react';
import Reply from './Reply';
import ReplyForm from './ReplyForm';
import { mediaAPI, repliesAPI, interestSignalsAPI } from '../services/api';

function ReplyList({
  statusId,
  initialCount,
  onCountChange,
  focusReplyId = null,
  showForm = true,
  formPlaceholder,
  formButtonLabel,
  indent = 0,
  reloadSignal = 0
}) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReplies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await repliesAPI.getByStatus(statusId);
      setReplies(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error al cargar respuestas:', err);
      setError('Error al cargar las respuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (statusId) {
      loadReplies();
    }
  }, [statusId, reloadSignal]);

  useEffect(() => {
    if (!focusReplyId) return;
    const el = document.getElementById(`reply-${focusReplyId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusReplyId, replies]);

  const handleCreateReply = async (content, file = null) => {
    try {
      setIsSubmitting(true);

      let mediaUrl = null;
      if (file) {
        const uploadRes = await mediaAPI.upload(file);
        mediaUrl = uploadRes?.data?.publicUrl || null;
      }

      await repliesAPI.create(statusId, content, mediaUrl);

      // Registrar señal de interés por responder
      try {
        await interestSignalsAPI.record({
          statusId: statusId,
          signalType: 'reply',
          value: 1,
          metadata: JSON.stringify({ 
            hasMedia: !!mediaUrl,
            contentLength: content.length 
          })
        });
        console.log(`✅ Señal de REPLY registrada en status ${statusId}`);
      } catch (signalError) {
        console.error('Error al registrar señal de reply:', signalError);
        // No bloqueamos el flujo si falla la señal
      }

      // Recargar respuestas para obtener la estructura completa
      const response = await repliesAPI.getByStatus(statusId);
      const newReplies = Array.isArray(response.data) ? response.data : [];
      setReplies(newReplies);

      // Actualizar contador con el número real de respuestas
      if (onCountChange) {
        onCountChange(newReplies.length);
      }

      setError(null);
    } catch (err) {
      console.error('Error al crear respuesta:', err);
      alert('Error al publicar la respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      await repliesAPI.delete(replyId);

      // Eliminar respuesta de la lista
      const newReplies = replies.filter(r => r.id !== replyId);
      setReplies(newReplies);

      // Actualizar contador
      if (onCountChange) {
        onCountChange(newReplies.length);
      }
    } catch (err) {
      console.error('Error al eliminar respuesta:', err);
      alert('Error al eliminar la respuesta');
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>Cargando respuestas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ ...containerStyle, ...(indent ? nestedContainerStyle(indent) : null) }}>
      {showForm && (
        <ReplyForm
          onSubmit={handleCreateReply}
          isLoading={isSubmitting}
          placeholder={formPlaceholder}
          buttonLabel={formButtonLabel}
        />
      )}
      
      {replies.length === 0 ? (
        <div style={emptyStyle}>
          No hay respuestas aún. ¡Sé el primero en responder!
        </div>
      ) : (
        <div>
          {replies.filter(r => r && r.id).map(reply => (
            <div
              key={reply.id}
              id={`reply-${reply.id}`}
              style={
                focusReplyId && reply.id === Number(focusReplyId)
                  ? { borderRadius: 8, outline: '2px solid #1da1f2', outlineOffset: 2, padding: 6, margin: '4px 0' }
                  : undefined
              }
            >
              <Reply
                reply={reply}
                onDelete={handleDeleteReply}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #e1e8ed'
};

const nestedContainerStyle = (indent) => ({
  marginTop: '10px',
  paddingTop: '10px',
  borderTop: 'none',
  marginLeft: `${Math.min(indent, 6) * 16}px`,
  paddingLeft: '12px',
  borderLeft: '2px solid #e6ecf0'
});

const loadingStyle = {
  textAlign: 'center',
  padding: '20px',
  color: '#657786',
  fontSize: '0.875rem'
};

const errorStyle = {
  padding: '12px',
  backgroundColor: '#fee',
  color: '#c00',
  borderRadius: '6px',
  fontSize: '0.875rem'
};

const emptyStyle = {
  textAlign: 'center',
  padding: '24px',
  color: '#657786',
  fontSize: '0.875rem'
};

export default ReplyList;