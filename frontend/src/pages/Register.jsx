import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GoogleIcon from '../components/GoogleIcon';

function Register() {
  const [formData, setFormData] = useState({
    Username: '',
    Email: '',
    Password: ''
  });
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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

  const onAuthSuccess = (token) => {
    const user = parseUserFromToken(token);
    if (!user.id) {
      setError('No se pudo extraer el ID del token. Contacta al administrador.');
      return;
    }
    login(token, user);
    navigate('/');
  };

  const handleGoogleRedirect = () => {
    setError('');
    window.location.href = authAPI.googleStartUrl();
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  // Validar longitud del username
  if (formData.Username.length > 25) {
    setError('El nombre de usuario no puede tener más de 25 caracteres.');
    return;
  }

  // Validar que el username no tenga espacios
  if (formData.Username.includes(' ')) {
    setError('El nombre de usuario no puede contener espacios. Usa guiones bajos (_) en su lugar.');
    return;
  }

  // Validar que el username solo contenga caracteres válidos
  if (!/^[a-zA-Z0-9_]+$/.test(formData.Username)) {
    setError('El nombre de usuario solo puede contener letras, números y guiones bajos.');
    return;
  }

  // Validar dominio del email antes de enviar
  if (!formData.Email.endsWith('@alumno.etec.um.edu.ar') && !formData.Email.endsWith('@etec.um.edu.ar')) {
    setError('Solo se permiten registros con emails @etec.um.edu.ar');
    return;
  }

  if (!acceptedPolicy) {
    setError('Debes aceptar la Política de Privacidad para registrarte.');
    return;
  }

  setLoading(true);

  try {
    const response = await authAPI.register(formData);
    console.log('Registro exitoso:', response.data);
    
    // Mostrar mensaje de éxito y redirigir al login
    alert('¡Registro exitoso! Por favor revisa tu email para verificar tu cuenta antes de iniciar sesión.');
    navigate('/login');
  } catch (err) {
    setError(err.response?.data?.error || 'Error al registrarse');
    console.error('Error:', err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={containerStyle}>
      <h1>Registrarse</h1>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={fieldStyle}>
          <label>Nombre de usuario:</label>
          <input
            type="text"
            name="Username"
            value={formData.Username}
            onChange={handleChange}
            placeholder="usuario_123"
            pattern="[a-zA-Z0-9_]+"
            title="Solo letras, números y guiones bajos. Sin espacios."
            required
            style={inputStyle}
            maxLength={25}
          />
          <small style={{ color: '#657786', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
            Solo letras, números y guiones bajos (_). Máximo 25 caracteres. ({formData.Username.length}/25)
          </small>
        </div>
        
        <div style={fieldStyle}>
          <label>Email:</label>
          <input
            type="email"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
            placeholder="tu@email.com"
            required
            style={inputStyle}
          />
        </div>
        
        <div style={fieldStyle}>
          <label>Contraseña:</label>
          <input
            type="password"
            name="Password"
            value={formData.Password}
            onChange={handleChange}
            placeholder="••••••"
            required
            style={inputStyle}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="acceptPolicy"
            checked={acceptedPolicy}
            onChange={(e) => setAcceptedPolicy(e.target.checked)}
            style={{ marginTop: '0.25rem', cursor: 'pointer', minWidth: '16px', minHeight: '16px' }}
          />
          <label htmlFor="acceptPolicy" style={{ fontSize: '0.875rem', color: '#657786', cursor: 'pointer', lineHeight: '1.4' }}>
            He leído y acepto la{' '}
            <span
              onClick={(e) => { e.preventDefault(); navigate('/privacy-policy', { state: { from: '/register' } }); }}
              style={{ color: '#1da1f2', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Política de Privacidad
            </span>
          </label>
        </div>

        <button type="submit" disabled={loading || !acceptedPolicy} style={{
          ...buttonStyle,
          opacity: (!acceptedPolicy || loading) ? 0.6 : 1,
          cursor: (!acceptedPolicy || loading) ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={handleGoogleRedirect} disabled={loading} style={googleButtonStyle}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <GoogleIcon size={20} />
            <span>Registrarse con Google</span>
          </span>
        </button>
      </div>

      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e1e8ed' }}>
        <p style={{ fontSize: '0.9rem', color: '#657786', marginBottom: '0.75rem', textAlign: 'center' }}>
          ¿Prefieres usar nuestra app móvil?
        </p>
        <button 
          type="button" 
          onClick={() => navigate('/descargar-app')} 
          style={mobileAppButtonStyle}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
            </svg>
            <span>Descargar App Móvil</span>
          </span>
        </button>
      </div>
    </div>
  );
}

const containerStyle = {
  maxWidth: '400px',
  margin: '0 auto'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const inputStyle = {
  padding: '0.5rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '4px'
};

const buttonStyle = {
  padding: '0.75rem',
  fontSize: '1rem',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const errorStyle = {
  padding: '0.75rem',
  backgroundColor: '#fee',
  color: '#c00',
  borderRadius: '4px',
  marginBottom: '1rem'
};

const googleButtonStyle = {
  padding: '0.75rem',
  fontSize: '1rem',
  backgroundColor: 'white',
  color: '#111',
  border: '1px solid #dadce0',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '100%',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
};

const mobileAppButtonStyle = {
  padding: '0.75rem',
  fontSize: '1rem',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  width: '100%',
  fontWeight: '500',
  transition: 'all 0.2s ease'
};

export default Register;