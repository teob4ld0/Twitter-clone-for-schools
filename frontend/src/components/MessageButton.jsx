import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { createOrGetChat } from '../store/chatSlice';

function MessageButton({ userId, isMobile = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // No mostrar si es el propio usuario o no hay sesión
  if (!user || Number(user.id) === Number(userId)) {
    return null;
  }

  const handleSendMessage = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const chat = await dispatch(createOrGetChat(Number(userId))).unwrap();
      navigate(`/chats?chatId=${chat.id}`);
    } catch (err) {
      console.error('Error opening chat:', err);
      alert('No se pudo abrir el chat');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonStyle = {
    padding: isMobile ? '12px 16px' : '10px 14px',
    borderRadius: 9999,
    border: '1px solid #9b59b6',
    background: isHovered ? '#f3e8fa' : '#fff',
    color: '#9b59b6',
    fontWeight: 700,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: isMobile ? '16px' : '14px',
    opacity: isLoading ? 0.6 : 1,
    transition: 'all 0.2s',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
  };

  return (
    <button
      onClick={handleSendMessage}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyle}
      disabled={isLoading}
    >
      {isLoading ? 'Abriendo...' : 'Mensaje'}
    </button>
  );
}

export default MessageButton;
