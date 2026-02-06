import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import GoogleIcon from '../components/GoogleIcon';

function Login() {
  const [formData, setFormData] = useState({
    Email: '',
    Password: ''
  });
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
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token } = response.data;
      onAuthSuccess(token);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1>Iniciar Sesión</h1>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={formStyle}>
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
        
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <button type="button" onClick={handleGoogleRedirect} disabled={loading} style={googleButtonStyle}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <GoogleIcon size={20} />
            <span>Continuar con Google</span>
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

export default Login;