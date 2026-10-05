import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', background: 'black', padding: '20px', zIndex: 9999, position: 'relative'}}>Error: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}
