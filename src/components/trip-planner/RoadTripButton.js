import React from 'react';
import { Button } from '@mui/material';

// כפתור תכנון טיול מתגלגל - הוסף אותו ליד כפתור תכנון הטיול הרגיל
const RoadTripButton = ({ onClick }) => (
  <Button
    variant="contained"
    color="secondary"
    onClick={onClick}
    startIcon={<i className="material-icons">explore</i>}
    sx={{
      mt: 2,
      ml: 2,
      background: '#9C27B0',
      color: '#fff',
      borderRadius: '8px',
      padding: '10px 20px',
      '&:hover': { background: '#7B1FA2' }
    }}
    aria-label="תכנן טיול מתגלגל לאורך המסלול"
  >
    תכנן טיול מתגלגל לאורך המסלול
  </Button>
);

export default RoadTripButton;
