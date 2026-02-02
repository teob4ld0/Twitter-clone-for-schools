import { useState, useRef } from 'react';
import { mediaAPI, statusAPI } from '../services/api';

function CreateStatus({ onStatusCreated }) {
  const [formData, setFormData] = useState({
    content: ''
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/mov'];
    if (!validTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP) y videos (MP4, WEBM, MOV).');
      return;
    }

    if (file.size > 512 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 512MB.');
      return;
    }

    setError('');
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validar tamaño del archivo (512MB máximo)
      if (mediaFile && mediaFile.size > 512 * 1024 * 1024) {
        setError('El archivo es demasiado pesado. Debe ser menor a 512 MB.');
        setLoading(false);
        return;
      }

      let mediaUrl = null;
      if (mediaFile) {
        const uploadRes = await mediaAPI.upload(mediaFile);
        mediaUrl = uploadRes?.data?.publicUrl || null;
      }

      const response = await statusAPI.create({
        content: formData.content,
        mediaUrl: mediaUrl
      });

      setFormData({ content: '' });
      setMediaFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onStatusCreated(response.data);
    } catch (err) {
      const serverMsg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.error;
      setError(serverMsg || 'Error al crear estado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Postea algo</h2>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={formStyle}>
        
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          placeholder="¿Qué estás pensando?"
          required
          rows="4"
          style={textareaStyle}
          maxLength={350}
        />
        
        <div style={charCountStyle}>
          {formData.content.length}/350
        </div>

        {mediaPreview && (
          <div style={mediaPreviewContainerStyle}>
            {mediaFile?.type.startsWith('image/') ? (
              <img src={mediaPreview} alt="Preview" style={mediaPreviewStyle} />
            ) : (
              <video src={mediaPreview} controls style={mediaPreviewStyle} />
            )}
            <button
              onClick={handleRemoveMedia}
              style={removeMediaBtnStyle}
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        <div style={actionsRowStyle}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/mov"
            disabled={loading || !!mediaFile}
            onChange={handleMediaSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={mediaButtonStyle}
            disabled={loading || !!mediaFile}
            type="button"
            title="Adjuntar imagen o video"
          >
            <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            {mediaFile && <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem' }}>📎 {mediaFile.name}</span>}
          </button>
          
          <button 
            type="submit" 
            disabled={loading || formData.content.length > 350 || !formData.content.trim()} 
            style={{
              ...buttonStyle,
              opacity: (loading || formData.content.length > 350 || !formData.content.trim()) ? 0.5 : 1,
              cursor: (loading || formData.content.length > 350 || !formData.content.trim()) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </form>
    </div>
  );
}

const containerStyle = {
  padding: '1.5rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  backgroundColor: '#fff',
  marginBottom: '2rem'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const textareaStyle = {
  padding: '0.75rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  resize: 'vertical'
};

const buttonStyle = {
  padding: '0.75rem',
  fontSize: '1rem',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const errorStyle = {
  padding: '0.75rem',
  backgroundColor: '#fee',
  color: '#c00',
  borderRadius: '4px',
  marginBottom: '1rem'
};

const actionsRowStyle = {
  display: 'flex',
  gap: '0.75rem',
  alignItems: 'center'
};

const mediaButtonStyle = {
  padding: '0.75rem',
  backgroundColor: 'transparent',
  color: '#1da1f2',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s',
  fontSize: '1rem'
};

const mediaPreviewContainerStyle = {
  position: 'relative',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e1e8ed',
  marginBottom: '0.5rem'
};

const mediaPreviewStyle = {
  width: '100%',
  maxHeight: '300px',
  objectFit: 'cover',
  display: 'block'
};

const removeMediaBtnStyle = {
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
  justifyContent: 'center'
};

const charCountStyle = {
  fontSize: '0.875rem',
  color: '#657786',
  textAlign: 'right',
  marginTop: '-0.5rem'
};

export default CreateStatus;