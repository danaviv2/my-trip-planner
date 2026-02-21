import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h1>אירעה שגיאה</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>נסה שוב</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;