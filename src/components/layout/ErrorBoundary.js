// src/components/layout/ErrorBoundary.js
import React, { Component } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

/**
 * ErrorBoundary - קומפוננט לתפיסת שגיאות בזמן ריצה
 * מציג הודעת שגיאה ידידותית למשתמש במקום קריסת האפליקציה
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // עדכון המצב כדי להציג את UI החלופי
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // רישום פרטי השגיאה
    console.error('שגיאה נתפסה על ידי ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    // ניסיון לטעון מחדש את האפליקציה
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // קרתה שגיאה, הצג ממשק חלופי
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          p: 3
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              textAlign: 'center',
              borderRadius: '12px'
            }}
          >
            <Typography variant="h4" gutterBottom sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
              משהו השתבש
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              אנו מתנצלים על התקלה. אירעה שגיאה בזמן טעינת האפליקציה.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ 
                textAlign: 'left', 
                p: 2, 
                bgcolor: '#f5f5f5', 
                borderRadius: '8px',
                mb: 3,
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  פרטי השגיאה (למפתחים):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-wrap',
                  color: '#d32f2f'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Typography>
              </Box>
            )}
            
            <Button 
              variant="contained" 
              color="primary" 
              onClick={this.handleReset}
              sx={{ 
                fontWeight: 'bold',
                borderRadius: '8px',
                px: 4
              }}
            >
              נסה שוב
            </Button>
          </Paper>
        </Box>
      );
    }

    // אם אין שגיאה, רנדר את הילדים כרגיל
    return this.props.children;
  }
}

export default ErrorBoundary;