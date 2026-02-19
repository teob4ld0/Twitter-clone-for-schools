import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { promptInstall, isStandalone } from '../utils/pwa';
import { getMobileOS } from '../utils/deviceDetection';

const InstallPWA = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceOS, setDeviceOS] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsInstalled(isStandalone());
    setDeviceOS(getMobileOS());

    // Si ya está instalada, redirigir a página de agradecimiento
    if (isStandalone()) {
      setTimeout(() => {
        navigate('/gracias-por-instalar');
      }, 2000);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [navigate]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    
    if (installed) {
      // Si se instaló correctamente, redirigir a página de agradecimiento
      setTimeout(() => {
        navigate('/gracias-por-instalar');
      }, 1000);
    }
  };

  if (isInstalled) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <div style={successIconStyle}>✓</div>
          <h2 style={titleStyle}>¡Ya tienes la app instalada!</h2>
          <p style={textStyle}>Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={iconContainerStyle}>
          <svg viewBox="0 0 512 512" width="80" height="80">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#1da1f2', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#0d8bd9', stopOpacity: 1}} />
              </linearGradient>
            </defs>
            <rect width="512" height="512" fill="url(#grad)" rx="80"/>
            <text x="256" y="356" fontFamily="Arial, sans-serif" fontSize="360" fontWeight="bold" fill="#ffffff" textAnchor="middle">T</text>
          </svg>
        </div>

        <h2 style={titleStyle}>Instalar MyNetApp</h2>
        <p style={textStyle}>
          Instala nuestra aplicación web progresiva para una mejor experiencia
        </p>

        <div style={featuresStyle}>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🚀</span>
            <span>Acceso rápido desde tu inicio</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>🔔</span>
            <span>Notificaciones en tiempo real</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>📱</span>
            <span>Experiencia como app nativa</span>
          </div>
          <div style={featureItemStyle}>
            <span style={featureIconStyle}>💾</span>
            <span>Funciona sin conexión</span>
          </div>
        </div>

        {canInstall ? (
          <button style={buttonStyle} onClick={handleInstall}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '0.5rem'}}>
              <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z"/>
            </svg>
            Instalar Ahora
          </button>
        ) : (
          <div style={manualInstructionsStyle}>
            <h3 style={instructionsTitleStyle}>📲 Instrucciones de instalación:</h3>
            
            {deviceOS === 'ios' ? (
              <div style={stepsStyle}>
                <p style={instructionsHeaderStyle}><strong>En Safari:</strong></p>
                <ol style={orderedListStyle}>
                  <li>Toca el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba)</li>
                  <li>Desplázate y selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Toca <strong>"Añadir"</strong></li>
                </ol>
              </div>
            ) : (
              <div style={stepsStyle}>
                <p style={instructionsHeaderStyle}><strong>En Chrome/Edge:</strong></p>
                <ol style={orderedListStyle}>
                  <li>Toca el menú <strong>⋮</strong> (tres puntos)</li>
                  <li>Selecciona <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Toca <strong>"Instalar"</strong></li>
                </ol>
              </div>
            )}

            <button style={secondaryButtonStyle} onClick={handleInstall}>
              Intentar instalar de todos modos
            </button>
          </div>
        )}

        <a href="/login" style={linkStyle}>
          Volver al inicio de sesión
        </a>
      </div>
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

const iconContainerStyle = {
  marginBottom: '2rem',
  display: 'flex',
  justifyContent: 'center'
};

const successIconStyle = {
  fontSize: '4rem',
  color: '#17bf63',
  marginBottom: '1rem'
};

const titleStyle = {
  color: '#14171a',
  fontSize: '1.8rem',
  fontWeight: 'bold',
  marginBottom: '1rem'
};

const textStyle = {
  color: '#657786',
  fontSize: '1rem',
  lineHeight: '1.5',
  marginBottom: '2rem'
};

const featuresStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '2rem'
};

const featureItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#f7f9fa',
  borderRadius: '10px',
  fontSize: '0.875rem',
  color: '#14171a'
};

const featureIconStyle = {
  fontSize: '2rem',
  marginBottom: '0.5rem'
};

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: '1rem',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  cursor: 'pointer',
  marginBottom: '1rem',
  transition: 'background-color 0.2s ease'
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#657786',
  fontSize: '0.9rem',
  fontWeight: 'normal',
  marginTop: '1rem'
};

const manualInstructionsStyle = {
  textAlign: 'left',
  backgroundColor: '#f7f9fa',
  padding: '1.5rem',
  borderRadius: '10px',
  marginBottom: '1.5rem'
};

const instructionsTitleStyle = {
  fontSize: '1rem',
  marginBottom: '1rem',
  textAlign: 'center',
  color: '#14171a'
};

const instructionsHeaderStyle = {
  marginBottom: '0.5rem',
  color: '#14171a'
};

const stepsStyle = {
  marginBottom: '1rem'
};

const orderedListStyle = {
  paddingLeft: '1.5rem',
  color: '#657786',
  fontSize: '0.9rem',
  lineHeight: '1.8'
};

const linkStyle = {
  color: '#1da1f2',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500'
};

export default InstallPWA;
