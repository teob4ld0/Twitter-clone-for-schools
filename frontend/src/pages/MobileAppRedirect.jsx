import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMobileOS } from '../utils/deviceDetection';

const MobileAppRedirect = () => {
  const [detecting, setDetecting] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const redirectUser = () => {
      const os = getMobileOS();
      
      // Pequeño delay para mostrar el mensaje de detección
      setTimeout(() => {
        if (os === 'android') {
          // Si es Android, redirigir al APK
          const apkUrl = 'https://io.twittetec.com/api/download/apk';
          window.location.href = apkUrl;
          
          // Después de un momento, redirigir a la página de agradecimiento
          setTimeout(() => {
            navigate('/gracias-por-instalar');
          }, 2000);
        } else {
          // Si es otro dispositivo, intentar instalar PWA
          // Redirigir a la página de instalación PWA
          navigate('/instalar-pwa');
        }
      }, 1500);
    };

    redirectUser();
  }, [navigate]);

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={spinnerStyle}>
          <div style={loaderStyle}></div>
        </div>
        <h2 style={titleStyle}>Detectando tu dispositivo...</h2>
        <p style={textStyle}>Te estamos redirigiendo a la mejor opción para tu dispositivo</p>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1da1f2 0%, #0d8bd9 100%)',
  padding: '2rem'
};

const contentStyle = {
  textAlign: 'center',
  backgroundColor: 'white',
  borderRadius: '20px',
  padding: '3rem 2rem',
  maxWidth: '500px',
  width: '100%',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
};

const spinnerStyle = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '2rem'
};

const loaderStyle = {
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #1da1f2',
  borderRadius: '50%',
  width: '60px',
  height: '60px',
  animation: 'spin 1s linear infinite'
};

const titleStyle = {
  color: '#14171a',
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '1rem'
};

const textStyle = {
  color: '#657786',
  fontSize: '1rem',
  lineHeight: '1.5'
};

export default MobileAppRedirect;
