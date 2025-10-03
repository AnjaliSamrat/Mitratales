import React from 'react';
import { t } from './i18n';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '16px',
          margin: '8px 0',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          background: 'rgba(252, 165, 165, 0.1)',
          color: '#b91c1c'
        }}>
          <h3 style={{margin: '0 0 8px 0', fontSize: '14px'}}>
            {this.props.title || 'Something went wrong'}
          </h3>
          <p style={{margin: '0 0 12px 0', fontSize: '13px'}}>
            {this.props.message || 'This component encountered an error and couldn\'t load properly.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              background: '#b91c1c',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{marginTop: '12px', fontSize: '11px'}}>
              <summary>Error Details (Dev Only)</summary>
              <pre style={{marginTop: '8px', background: '#f3f4f6', padding: '8px', borderRadius: '4px', overflow: 'auto'}}>
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
