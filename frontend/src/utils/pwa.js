// Registro del Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration);
          
          // Configurar listener para mensajes del Service Worker
          setupServiceWorkerMessageListener();

          // Verificar actualizaciones
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                if (confirm('Nueva versión disponible. ¿Recargar?')) {
                  // Decirle al SW que se active
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.log('Error al registrar Service Worker:', error);
        });
    });
  }
}

// Configurar listener para mensajes desde el Service Worker
function setupServiceWorkerMessageListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, url, data } = event.data;

      if (type === 'NOTIFICATION_CLICKED') {
        // El usuario hizo click en una notificación push
        console.log('Notification clicked, navigating to:', url);
        
        // Navegar a la URL si es diferente de la actual
        if (url && window.location.pathname !== url) {
          window.location.href = url;
        }

        // Disparar evento personalizado que puede ser escuchado en la app
        window.dispatchEvent(new CustomEvent('push-notification-clicked', {
          detail: { url, data }
        }));
      }
    });
  }
}

// Solicitar permisos de notificación
export function requestNotificationPermission() {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Permiso de notificación concedido');
      }
    });
  }
}

// Detectar si la app se está ejecutando como PWA
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

// Detectar si es mobile
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Mostrar prompt de instalación de PWA
let deferredPrompt;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que el navegador muestre su propio prompt
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    
    // Mostrar UI personalizada para instalar la app
    showInstallPromotion();
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA instalada');
    deferredPrompt = null;
  });
}

function showInstallPromotion() {
  // Si ya está instalada o no es mobile, no mostrar
  if (isStandalone() || !isMobileDevice()) {
    return;
  }

  // Aquí puedes mostrar un banner personalizado
  // Por ahora solo lo registramos
  console.log('PWA puede ser instalada');
}

export function promptInstall() {
  if (!deferredPrompt) {
    return false;
  }

  // Mostrar el prompt
  deferredPrompt.prompt();
  
  // Esperar la respuesta del usuario
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }
    deferredPrompt = null;
  });

  return true;
}
