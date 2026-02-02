import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const uid = searchParams.get('uid');
      
      if (!token) {
        setStatus('error');
        setMessage('Token de verificación no encontrado en la URL');
        return;
      }

      if (!uid) {
        setStatus('error');
        setMessage('Parámetros de verificación incompletos');
        return;
      }
      
      try {
        const response = await authAPI.verifyEmail(token, uid);
        setStatus('success');
        setMessage(response.data.message || '¡Email verificado exitosamente!');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Error al verificar el email');
        console.error('Error:', err);
      }
    };
    
    verifyEmail();
  }, [searchParams, navigate]);
  
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {status === 'verifying' && (
          <>
            <div style={spinnerStyle}>⏳</div>
            <h1 style={titleStyle}>Verificando tu email...</h1>
            <p style={textStyle}>Por favor espera un momento</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div style={successIconStyle}>✓</div>
            <h1 style={titleStyle}>¡Email Verificado!</h1>
            <p style={textStyle}>{message}</p>
            <p style={subtextStyle}>Serás redirigido al inicio de sesión en unos segundos...</p>
            <button onClick={() => navigate('/login')} style={buttonStyle}>
              Ir al inicio de sesión ahora
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div style={errorIconStyle}>✗</div>
            <h1 style={titleStyle}>Error de Verificación</h1>
            <p style={errorTextStyle}>{message}</p>
            <div style={actionsStyle}>
              <button onClick={() => navigate('/login')} style={buttonStyle}>
                Ir al inicio de sesión
              </button>
              <button onClick={() => navigate('/register')} style={secondaryButtonStyle}>
                Registrarse nuevamente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f5f8fa',
  padding: '20px'
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '3rem',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  maxWidth: '500px',
  width: '100%',
  textAlign: 'center'
};

const spinnerStyle = {
  fontSize: '4rem',
  marginBottom: '1.5rem',
  animation: 'pulse 2s ease-in-out infinite'
};

const successIconStyle = {
  fontSize: '4rem',
  color: '#17bf63',
  marginBottom: '1.5rem',
  fontWeight: 'bold'
};

const errorIconStyle = {
  fontSize: '4rem',
  color: '#e0245e',
  marginBottom: '1.5rem',
  fontWeight: 'bold'
};

const titleStyle = {
  fontSize: '1.8rem',
  marginBottom: '1rem',
  color: '#14171a'
};

const textStyle = {
  fontSize: '1.1rem',
  color: '#657786',
  marginBottom: '1rem'
};

const subtextStyle = {
  fontSize: '0.9rem',
  color: '#aab8c2',
  marginBottom: '2rem'
};

const errorTextStyle = {
  fontSize: '1rem',
  color: '#e0245e',
  marginBottom: '2rem',
  backgroundColor: '#fee',
  padding: '1rem',
  borderRadius: '6px'
};

const actionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '25px',
  cursor: 'pointer',
  fontWeight: 'bold',
  transition: 'background-color 0.2s'
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: 'white',
  color: '#1da1f2',
  border: '1px solid #1da1f2'
};

export default VerifyEmail;
