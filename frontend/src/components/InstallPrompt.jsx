import { useState, useEffect } from 'react';
import { promptInstall, isStandalone, isMobileDevice } from '../utils/pwa';
import './InstallPrompt.css';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
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
    const installed = promptInstall();
    if (installed !== false) {
      setShowPrompt(false);
    }
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
        </div>

        <h3 className="install-prompt-title">Instalar Twittetec</h3>
        <p className="install-prompt-description">
          Instala nuestra app para acceder más rápido, recibir notificaciones y usarla sin conexión
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

        <div className="install-prompt-actions">
          <button className="install-prompt-btn install-prompt-btn-primary" onClick={handleInstall}>
            Instalar
          </button>
          <button className="install-prompt-btn install-prompt-btn-secondary" onClick={handleRemindLater}>
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
