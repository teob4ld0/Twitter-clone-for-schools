import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep console output for debugging
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'Error desconocido';

      return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ color: '#e0245e', marginTop: 0 }}>Se produjo un error en la UI</h2>
          <p style={{ color: '#657786' }}>
            Abrí la consola del navegador para ver el stack trace.
          </p>
          <pre
            style={{
              background: '#0b1020',
              color: '#d7e2ff',
              padding: 16,
              borderRadius: 8,
              overflowX: 'auto'
            }}
          >
            {message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
