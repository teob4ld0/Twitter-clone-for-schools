/**
 * Detección moderna de dispositivos móviles y sistemas operativos
 */

/**
 * Obtiene el sistema operativo del dispositivo móvil
 * @returns {'android' | 'ios' | 'desktop'} El sistema operativo detectado
 */
export const getMobileOS = () => {
  const ua = navigator.userAgent;
  
  // Detectar Android
  if (/android/i.test(ua)) {
    return "android";
  }
  
  // Detectar iOS (incluye nuevos iPads que se reportan como desktop)
  if (
    (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    return "ios";
  }
  
  return "desktop";
};

/**
 * Verifica si el dispositivo es móvil
 * @returns {boolean} true si es un dispositivo móvil
 */
export const isMobileDevice = () => {
  const os = getMobileOS();
  return os === 'android' || os === 'ios';
};

/**
 * Obtiene información detallada del dispositivo
 * @returns {Object} Objeto con información del dispositivo
 */
export const getDeviceInfo = () => {
  const os = getMobileOS();
  const isMobile = os === 'android' || os === 'ios';
  const userAgent = navigator.userAgent;
  
  return {
    os,
    isMobile,
    isAndroid: os === 'android',
    isIOS: os === 'ios',
    isDesktop: os === 'desktop',
    userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints
  };
};
