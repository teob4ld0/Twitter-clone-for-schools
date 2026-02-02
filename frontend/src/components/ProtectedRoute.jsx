import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Esperar a que AuthContext termine de cargar
    if (loading) return;

    if (!isAuthenticated()) {
      // Si llegó aquí con token expirado, hacer logout
      logout();
      navigate('/login', { replace: true });
    } else {
      setIsReady(true);
    }
  }, [isAuthenticated, logout, navigate, loading]);

  // Mostrar loading mientras AuthContext inicializa
  if (loading || !isReady) return null;

  return children;
}