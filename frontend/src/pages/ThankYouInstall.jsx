import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYouInstall = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirigir automáticamente al login después de 5 segundos
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={successAnimationStyle}>
          <div style={checkmarkCircleStyle}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#17bf63" />
              <path 
                d="M7 12.5l3 3 7-7" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <h1 style={titleStyle}>¡Gracias por instalar Twittetec!</h1>
        
        <p style={descriptionStyle}>
          Tu aplicación está lista para usar. Ahora podrás disfrutar de:
        </p>

        <div style={featuresStyle}>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>✨</span>
            <div>
              <strong style={featureTitleStyle}>Acceso instantáneo</strong>
              <p style={featureDescStyle}>Abre la app directamente desde tu pantalla de inicio</p>
            </div>
          </div>

          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🔔</span>
            <div>
              <strong style={featureTitleStyle}>Notificaciones en tiempo real</strong>
              <p style={featureDescStyle}>Mantente al día con mensajes y actualizaciones</p>
            </div>
          </div>

          <div style={featureItemStyle}>
            <span style={featureIconStyle}>⚡</span>
            <div>
              <strong style={featureTitleStyle}>Rendimiento optimizado</strong>
              <p style={featureDescStyle}>Experiencia rápida y fluida en tu dispositivo</p>
            </div>
          </div>

          <div style={featureItemStyle}>
            <span style={featureIconStyle}>💾</span>
            <div>
              <strong style={featureTitleStyle}>Modo offline</strong>
              <p style={featureDescStyle}>Accede a contenido incluso sin conexión</p>
            </div>
          </div>
        </div>

        <div style={actionsStyle}>
          <button style={primaryButtonStyle} onClick={handleGoToLogin}>
            Comenzar a usar MyNetApp
          </button>
          
          <p style={autoRedirectStyle}>
            Serás redirigido automáticamente en 5 segundos...
          </p>
        </div>

        <div style={footerStyle}>
          <p style={tipStyle}>
            💡 <strong>Tip:</strong> Encuentra el ícono de MyNetApp en tu pantalla de inicio para acceder rápidamente
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scaleIn {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
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
  padding: '2rem',
  animation: 'fadeIn 0.5s ease-out'
};

const contentStyle = {
  textAlign: 'center',
  backgroundColor: 'white',
  borderRadius: '20px',
  padding: '3rem 2rem',
  maxWidth: '600px',
  width: '100%',
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
  animation: 'fadeIn 0.7s ease-out'
};

const successAnimationStyle = {
  marginBottom: '2rem',
  animation: 'scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
};

const checkmarkCircleStyle = {
  display: 'inline-block'
};

const titleStyle = {
  color: '#14171a',
  fontSize: '2rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  animation: 'fadeIn 1s ease-out'
};

const descriptionStyle = {
  color: '#657786',
  fontSize: '1.1rem',
  lineHeight: '1.5',
  marginBottom: '2rem'
};

const featuresStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '1rem',
  marginBottom: '2rem',
  textAlign: 'left'
};

const featureItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: '#f7f9fa',
  borderRadius: '12px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
};

const featureIconStyle = {
  fontSize: '2rem',
  flexShrink: 0
};

const featureTitleStyle = {
  display: 'block',
  color: '#14171a',
  fontSize: '1rem',
  marginBottom: '0.25rem'
};

const featureDescStyle = {
  color: '#657786',
  fontSize: '0.875rem',
  margin: 0
};

const actionsStyle = {
  marginTop: '2rem'
};

const primaryButtonStyle = {
  width: '100%',
  padding: '1rem 2rem',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, transform 0.1s ease',
  marginBottom: '1rem'
};

const autoRedirectStyle = {
  color: '#657786',
  fontSize: '0.875rem',
  animation: 'pulse 2s ease-in-out infinite'
};

const footerStyle = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #e1e8ed'
};

const tipStyle = {
  color: '#657786',
  fontSize: '0.875rem',
  lineHeight: '1.5',
  margin: 0,
  padding: '1rem',
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  border: '1px solid #ffc107'
};

export default ThankYouInstall;
