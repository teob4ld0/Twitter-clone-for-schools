import { useState, useEffect } from 'react';
import { promptInstall, isStandalone, isMobileDevice } from '../utils/pwa';
import { getMobileOS } from '../utils/deviceDetection';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detectar si es Android
    const deviceOS = getMobileOS();
    setIsAndroid(deviceOS === 'android');

    // Verificar si ya está instalada o si el usuario ya lo rechazó
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    
    // Solo mostrar si:
    // 1. No está instalada
    // 2. Es un dispositivo móvil
    // 3. No ha sido rechazada previamente
    // 4. Han pasado al menos 30 segundos para no ser intrusivo
    if (!isStandalone() && isMobileDevice() && !hasBeenDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // Esperar 30 segundos antes de mostrar

      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    if (isAndroid) {
      // En Android, redirigir a la descarga del APK
      handleDownloadAPK();
    } else {
      // En otros dispositivos, usar el prompt de PWA
      const installed = promptInstall();
      if (installed !== false) {
        setShowPrompt(false);
      }
    }
  };

  const handleDownloadAPK = () => {
    // Descarga directa desde el API
    const apkUrl = 'https://io.twittetec.com/api/download/apk';
    
    // Opción 1: Abrir en nueva pestaña
    window.open(apkUrl, '_blank');
    
    // Opción 2: Descargar directamente
    // window.location.href = apkUrl;
    
    // Marcar como "instalado" para no molestar más
    setShowPrompt(false);
    const dismissedUntil = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 días
    localStorage.setItem('pwa-install-dismissed', dismissedUntil);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // Guardar que el usuario rechazó (se puede borrar en 7 días)
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 días
    localStorage.setItem('pwa-install-dismissed', dismissedUntil);
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    // Recordar más tarde (en 1 día)
    const remindAt = Date.now() + (24 * 60 * 60 * 1000); // 1 día
    localStorage.setItem('pwa-install-dismissed', remindAt);
  };

  if (!showPrompt || dismissed) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt">
        <button className="install-prompt-close" onClick={handleDismiss} aria-label="Cerrar">
          ×
        </button>
        
        <div className="install-prompt-icon">
          {isAndroid ? (
            // Ícono de Android
            <svg viewBox="0 0 24 24" width="64" height="64">
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" fill="#3DDC84"/>
            </svg>
          ) : (
            // Ícono de la app
            <svg viewBox="0 0 512 512" width="64" height="64">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#1da1f2', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#0d8bd9', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              <rect width="512" height="512" fill="url(#grad)" rx="80"/>
              <text x="256" y="356" fontFamily="Arial, sans-serif" fontSize="360" fontWeight="bold" fill="#ffffff" textAnchor="middle">T</text>
            </svg>
          )}
        </div>

        <h3 className="install-prompt-title">
          {isAndroid ? '¡Descarga nuestra app para Android!' : 'Instalar Twittetec'}
        </h3>
        <p className="install-prompt-description">
          {isAndroid 
            ? 'Descarga la aplicación nativa de Twittetec (APK) para una experiencia optimizada en tu dispositivo Android'
            : 'Instala nuestra app para acceder más rápido, recibir notificaciones y usarla sin conexión'
          }
        </p>

        <div className="install-prompt-features">
          <div className="install-prompt-feature">
            <span className="feature-icon">🚀</span>
            <span>Acceso rápido</span>
          </div>
          <div className="install-prompt-feature">
            <span className="feature-icon">🔔</span>
            <span>Notificaciones push</span>
          </div>
          <div className="install-prompt-feature">
            <span className="feature-icon">📱</span>
            <span>Experiencia nativa</span>
          </div>
        </div>

        {isAndroid && (
          <p className="install-prompt-note">
            💡 Debes habilitar "Fuentes desconocidas" en configuración para instalar APK
          </p>
        )}

        <div className="install-prompt-actions">
          <button className="install-prompt-btn install-prompt-btn-primary" onClick={handleInstall}>
            {isAndroid ? 'Descargar APK' : 'Instalar'}
          </button>
          <button className="install-prompt-btn install-prompt-btn-secondary" onClick={handleRemindLater}>
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
