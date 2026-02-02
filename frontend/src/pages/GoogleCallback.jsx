import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const parseUserFromToken = (token) => {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    return {
      id:
        tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        tokenPayload['sub'] ||
        tokenPayload['userId'] ||
        tokenPayload['id'],
      email:
        tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        tokenPayload['email'],
      username:
        tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        tokenPayload['name'] ||
        tokenPayload['username']
    };
  };

  useEffect(() => {
    const run = async () => {
      try {
        // If the backend redirected here with a token in the URL fragment
        // (e.g. /google/callback#token=...), consume it and send user to Feed.
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
          const hashParams = new URLSearchParams(hash.substring(1));
          const tokenFromHash = hashParams.get('token');
          if (tokenFromHash) {
            const user = parseUserFromToken(tokenFromHash);
            if (!user.id) {
              setError('No se pudo extraer el ID del token. Contacta al administrador.');
              return;
            }
            login(tokenFromHash, user);
            navigate('/', { replace: true });
            return;
          }
        }

        const errorParam = searchParams.get('error');
        if (errorParam) {
          setError(`Google devolvió error: ${errorParam}`);
          return;
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          setError('Faltan parámetros de Google (code/state)');
          return;
        }

        const response = await authAPI.googleExchangeCode(code, state);
        const { token } = response.data;

        const user = parseUserFromToken(token);
        if (!user.id) {
          setError('No se pudo extraer el ID del token. Contacta al administrador.');
          return;
        }

        login(token, user);
        navigate('/', { replace: true });
      } catch (err) {
        setError(err.response?.data?.error || 'Error procesando callback de Google');
        // Optional details are sometimes helpful during setup.
        if (err.response?.data?.details) {
          console.error('Google exchange details:', err.response.data.details);
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchParams, navigate, login]);

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      <h1>Google Login</h1>
      {loading && <p>Procesando...</p>}
      {error && <div style={{ padding: '0.75rem', backgroundColor: '#fee', color: '#c00', borderRadius: '4px' }}>{error}</div>}
      {!loading && !error && <p>Listo. Redirigiendo...</p>}
    </div>
  );
}

export default GoogleCallback;
