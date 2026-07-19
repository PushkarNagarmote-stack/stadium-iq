import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('StadiumIQ error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#fff', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: '24px' }}>
          <div>
            <div style={{ fontSize: '48px', marginBottom: '16px' }} aria-hidden="true">⚠️</div>
            <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Something went wrong</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '20px' }}>Please refresh the page to try again.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#ffd700', color: '#0a0e1a', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '15px' }}>Refresh Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);