import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/responsive.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { registerServiceWorker, initInstallPrompt } from './utils/pwa'

// Registrar Service Worker para PWA
registerServiceWorker();

// Inicializar prompt de instalación
initInstallPrompt();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)