import { useEffect, useState } from 'react';
import { getMobileOS, getDeviceInfo } from '../utils/deviceDetection';
import { promptInstall, isStandalone } from '../utils/pwa';
import '../styles/Download.css';

const Download = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
    setLoading(false);
    setIsPWAInstalled(isStandalone());
    
    console.log('Device Info:', info);

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDownloadAPK = () => {
    // Link directo al APK
    const apkUrl = 'https://tu-servidor.com/mynetapp.apk'; 
    window.location.href = apkUrl;
  };

  const handleInstallPWA = async () => {
    const installed = promptInstall();
    if (installed === false) {
      // Si no hay prompt disponible, mostrar instrucciones
      alert('Para instalar:\n\n- Chrome/Edge: Toca el menú (⋮) > "Instalar app"\n- Safari: Toca compartir y "Añadir a pantalla de inicio"');
    }
  };

  if (loading) {
    return (
      <div className="download-page">
        <div className="download-loading">
          <p>Detectando dispositivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="download-page">
      <div className="download-container">
        <div className="download-header">
          <h1>MyNetApp</h1>
          <p className="download-subtitle">Descarga nuestra aplicación</p>
        </div>

        {/* ANDROID: Descargar APK */}
        {deviceInfo.isAndroid && (
          <div className="download-content android">
            <div className="device-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" fill="#3DDC84"/>
              </svg>
            </div>
            <h2>¡Detectamos Android!</h2>
            <p>Descarga la aplicación de Twtittetec (APK)</p>
            <button className="download-btn android-btn" onClick={handleDownloadAPK}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,9h-4V3H9v6H5l7,7L19,9z M5,18v2h14v-2H5z"/>
              </svg>
              Descargar para Android
            </button>
            <p className="download-note">
              💡 Debes habilitar "Fuentes desconocidas" en configuración para instalar
            </p>
          </div>
        )}

        {/* iOS o Desktop: Instalar PWA */}
        {!deviceInfo.isAndroid && (
          <div className="download-content pwa">
            <div className="device-icon">
              <svg width="80" height="80" viewBox="0 0 512 512">
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

            {isPWAInstalled ? (
              <>
                <h2>¡Ya tienes la app instalada!</h2>
                <p>La aplicación web progresiva está instalada en tu dispositivo</p>
                <a href="/" className="download-btn pwa-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                  Ir a la app
                </a>
              </>
            ) : (
              <>
                <h2>{deviceInfo.isIOS ? '¡Detectamos iOS!' : 'Instala la App Web'}</h2>
                <p>Instala MyNetApp como aplicación web progresiva (PWA)</p>
                
                {canInstallPWA ? (
                  <button className="download-btn pwa-btn" onClick={handleInstallPWA}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z"/>
                    </svg>
                    Instalar App
                  </button>
                ) : (
                  <div className="manual-install-instructions">
                    <h3>📲 Instrucciones de instalación:</h3>
                    
                    {deviceInfo.isIOS ? (
                      <div className="install-steps">
                        <p><strong>En Safari:</strong></p>
                        <ol>
                          <li>Toca el botón <strong>Compartir</strong> <svg width="20" height="20" viewBox="0 0 24 24" fill="#007AFF" style={{verticalAlign: 'middle'}}><path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z"/></svg></li>
                          <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                          <li>Toca <strong>"Añadir"</strong></li>
                        </ol>
                      </div>
                    ) : (
                      <div className="install-steps">
                        <p><strong>En Chrome/Edge:</strong></p>
                        <ol>
                          <li>Toca el menú <strong>⋮</strong> (tres puntos)</li>
                          <li>Selecciona <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla de inicio"</strong></li>
                          <li>Toca <strong>"Instalar"</strong></li>
                        </ol>
                      </div>
                    )}

                    <button className="download-btn pwa-btn-secondary" onClick={handleInstallPWA}>
                      Intentar instalar
                    </button>
                  </div>
                )}

                <div className="pwa-features">
                  <h3>✨ Ventajas de la PWA:</h3>
                  <ul>
                    <li>🚀 Acceso rápido desde la pantalla de inicio</li>
                    <li>🔔 Notificaciones push en tiempo real</li>
                    <li>📱 Experiencia similar a una app nativa</li>
                    <li>💾 Funciona sin conexión (modo offline)</li>
                    <li>⚡ Actualizaciones automáticas</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        <div className="download-footer">
          <p className="device-detected">
            Dispositivo detectado: <strong>{deviceInfo.os === 'desktop' ? 'Computadora' : deviceInfo.os.toUpperCase()}</strong>
          </p>
          
          {deviceInfo.isAndroid && (
            <p className="alt-option">
              ¿Prefieres la versión web? <a href="/login">Usa el PWA</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Download;
