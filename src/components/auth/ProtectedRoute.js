import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    // הנתיב בלבד אינו מספיק: מוזמן שמגיע עם קישור כמו
    // /group-trip?room=ABCD1234 היה חוזר מההתחברות בלי הקוד, וההזמנה
    // מתה בשקט. נשמרים גם המחרוזת שאחרי הסימן וגם העוגן.
    const target = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" state={{ from: target }} replace />;
  }

  return children;
};

export default ProtectedRoute;
