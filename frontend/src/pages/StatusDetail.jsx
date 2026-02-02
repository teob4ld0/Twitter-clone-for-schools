import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { statusAPI } from '../services/api';
import Status from '../components/Status';
import { useIsMobile } from '../hooks/useMobile';

export default function StatusDetail() {
  const { statusId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const focusReplyId = searchParams.get('replyId');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await statusAPI.getById(statusId);
        if (cancelled) return;
        setStatus(res.data);
      } catch (err) {
        console.error('Error loading status:', err);
        if (!cancelled) setError('No se pudo cargar el estado');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (statusId) load();
    return () => {
      cancelled = true;
    };
  }, [statusId]);

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#657786' }}>Cargando estado...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#e0245e' }}>
        <div style={{ marginBottom: 12 }}>{error}</div>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '10px 16px', borderRadius: 9999, border: 'none', background: '#1da1f2', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
        >
          ← Volver
        </button>
      </div>
    );
  }

  if (!status) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#657786' }}>Estado no encontrado</div>;
  }

  return (
    <div style={isMobile ? mobileContainerStyle : containerStyle}>
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={backButtonStyle}
        >
          ← Volver
        </button>
      </div>

      <Status
        status={status}
        onDelete={() => {}}
        initialShowReplies={true}
        focusReplyId={focusReplyId}
      />
    </div>
  );
}

const containerStyle = {
  maxWidth: 600,
  margin: '0 auto',
  padding: 20
};

const mobileContainerStyle = {
  maxWidth: '100%',
  margin: 0,
  padding: '0.5rem'
};

const backButtonStyle = {
  background: 'none',
  border: 'none',
  color: '#1da1f2',
  cursor: 'pointer',
  fontWeight: 700,
  padding: '8px 12px',
  fontSize: '16px',
  minHeight: '44px',
  minWidth: '44px'
};