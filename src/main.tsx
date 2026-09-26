import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

// Suppress benign ResizeObserver error
const resizeObserverLoopErr = 'ResizeObserver loop completed with undelivered notifications.';
const resizeObserverLoopErr2 = 'ResizeObserver loop limit exceeded';

const originalError = window.console.error;
window.console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && (args[0].includes(resizeObserverLoopErr) || args[0].includes(resizeObserverLoopErr2))) {
    return;
  }
  originalError(...args);
};

window.addEventListener('error', (e) => {
  if (e.message === resizeObserverLoopErr || e.message === resizeObserverLoopErr2 || e.message.includes('ResizeObserver')) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

import App from './App.tsx';
import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{color: '#ff4d4f', padding: '24px', background: '#050811', zIndex: 9999, position: 'fixed', inset: 0, overflow: 'auto', fontFamily: 'monospace'}}>
          <h1 style={{fontSize: '20px', fontWeight: 'bold', marginBottom: '12px'}}>Something went wrong in Lights Out Tattoo</h1>
          <p style={{color: '#aaa', fontSize: '13px', marginBottom: '16px'}}>An unhandled runtime exception occurred:</p>
          <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(255,0,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,0,0,0.3)', marginBottom: '12px'}}>{this.state.error && this.state.error.toString()}</pre>
          <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#666', fontSize: '11px'}}>{this.state.error && this.state.error.stack}</pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{marginTop: '16px', padding: '8px 16px', background: '#00f0ff', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children; 
  }
}

import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
);
