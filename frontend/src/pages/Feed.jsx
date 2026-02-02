import { useState, useEffect } from 'react';
import { statusAPI } from '../services/api';
import CreateStatus from '../components/CreateStatus';
import Status from '../components/Status';

function Feed() {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const response = await statusAPI.getAll();
      const statusesData = Array.isArray(response.data) ? response.data : [];
      setStatuses(statusesData);
      setError('');
    } catch (err) {
      setError('Error al cargar estados');
      console.error('Error loading statuses:', err);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusCreated = (newStatus) => {
    setStatuses([newStatus, ...statuses]);
  };

  const handleDelete = async (statusId) => {
    try {
      await statusAPI.delete(statusId);
      setStatuses(statuses.filter(status => status.id !== statusId));
    } catch (err) {
      alert('Error al eliminar estado');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}>⏳</div>
        <p>Cargando estados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <p>{error}</p>
        <button onClick={loadStatuses} style={retryButtonStyle}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Feed</h1>
      
      <CreateStatus onStatusCreated={handleStatusCreated} />
      
      {statuses.length === 0 ? (
        <div style={emptyStateStyle}>
          <p>📭 No hay estados aún.</p>
          <p style={emptySubtextStyle}>¡Sé el primero en publicar!</p>
        </div>
      ) : (
        <div>
          {statuses.map(status => (
            <Status 
              key={status.id} 
              status={status} 
              onDelete={handleDelete}
              onQuoteCreated={handleStatusCreated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto'
};

const titleStyle = {
  fontSize: '1.5rem',
  marginBottom: '1.5rem',
  color: '#14171a'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem',
  color: '#657786'
};

const spinnerStyle = {
  fontSize: '3rem',
  animation: 'spin 1s linear infinite'
};

const errorContainerStyle = {
  padding: '2rem',
  textAlign: 'center',
  backgroundColor: '#fee',
  color: '#c00',
  borderRadius: '8px'
};

const retryButtonStyle = {
  marginTop: '1rem',
  padding: '0.5rem 1rem',
  backgroundColor: '#1da1f2',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem',
  color: '#657786'
};

const emptySubtextStyle = {
  fontSize: '0.875rem',
  marginTop: '0.5rem'
};

export default Feed;