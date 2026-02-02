import { useEffect, useRef, useState } from 'react';

function ReplyForm({
  onSubmit,
  isLoading,
  placeholder = 'Escribe una respuesta...',
  buttonLabel = 'Responder',
  autoFocus = false,
  compact = false
}) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [fileError, setFileError] = useState('');
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      setFileError('Tipo de archivo no válido.');
      return;
    }

    if (file.size > 512 * 1024 * 1024) {
      setFileError('El archivo es demasiado grande. Máximo 512MB.');
      return;
    }

    setFileError('');
    setMediaFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar tamaño del archivo (512MB máximo)
    if (mediaFile && mediaFile.size > 512 * 1024 * 1024) {
      setFileError('El archivo es demasiado pesado. Debe ser menor a 512 MB.');
      return;
    }
    
    if (content.trim()) {
      setFileError('');
      await onSubmit(content, mediaFile);
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} style={compact ? compactFormStyle : formStyle}>
      {fileError && <div style={errorStyle}>{fileError}</div>}
      <div style={topRowStyle}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows="2"
          style={textareaStyle}
          disabled={isLoading}
          maxLength={280}
        />
        <button 
          type="submit" 
          style={{
            ...buttonStyle,
            opacity: (isLoading || !content.trim() || content.length > 280) ? 0.5 : 1
          }}
          disabled={isLoading || !content.trim() || content.length > 280}
        >
          {isLoading ? 'Enviando...' : buttonLabel}
        </button>
      </div>
      
      <div style={charCountStyleReply}>
        {content.length}/280
      </div>
      
      {mediaPreview && (
        <div style={mediaPreviewContainerStyle}>
          {mediaFile?.type.startsWith('image/') ? (
            <img src={mediaPreview} alt="Preview" style={mediaPreviewImageStyle} />
          ) : (
            <video src={mediaPreview} controls style={mediaPreviewImageStyle} />
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

      <div style={bottomRowStyle}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov"
          disabled={isLoading || !!mediaFile}
          onChange={handleMediaSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          style={mediaButtonStyle}
          disabled={isLoading || !!mediaFile}
          type="button"
          title="Adjuntar imagen o video"
        >
          <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </button>
        {mediaFile && (
          <span style={fileNameStyle}>📎 {mediaFile.name}</span>
        )}
      </div>
    </form>
  );
}

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: '#f7f9fa',
  borderRadius: '8px'
};

const compactFormStyle = {
  ...formStyle,
  marginBottom: '10px',
  padding: '10px'
};

const topRowStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-end'
};

const bottomRowStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  flexWrap: 'wrap',
  width: '100%',
  overflow: 'hidden'
};

const textareaStyle = {
  flex: 1,
  padding: '8px 12px',
  fontSize: '16px',
  border: '1px solid #e1e8ed',
  borderRadius: '6px',
  resize: 'vertical',
  fontFamily: 'inherit',
  minHeight: '40px',
  maxWidth: '100%'
};

const buttonStyle = {
  padding: '10px 16px',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  flexShrink: 0,
  minHeight: '44px',
  whiteSpace: 'nowrap'
};

const fileInputStyle = {
  fontSize: '14px',
  flex: 1,
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const fileNameStyle = {
  fontSize: '12px',
  color: '#657786',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
  minWidth: 0,
  maxWidth: '100%'
};

const errorStyle = {
  padding: '8px 12px',
  backgroundColor: '#fee',
  color: '#c00',
  borderRadius: '6px',
  fontSize: '0.875rem',
  marginBottom: '8px',
  width: '100%'
};

const mediaButtonStyle = {
  padding: '0.5rem',
  backgroundColor: 'transparent',
  color: '#1da1f2',
  border: '1px solid #e1e8ed',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  transition: 'background-color 0.2s'
};

const mediaPreviewContainerStyle = {
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e1e8ed',
  marginBottom: '0.5rem'
};

const mediaPreviewImageStyle = {
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  display: 'block'
};

const removeMediaButtonStyle = {
  position: 'absolute',
  top: '0.5rem',
  right: '0.5rem',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const charCountStyleReply = {
  fontSize: '0.75rem',
  color: '#657786',
  textAlign: 'right',
  marginTop: '0.25rem'
};

export default ReplyForm;