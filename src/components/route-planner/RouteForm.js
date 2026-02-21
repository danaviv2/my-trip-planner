// src/components/route-planner/RouteForm.js
import React, { useContext } from 'react';
import { Box, TextField, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { TripContext } from '../../contexts/TripContext';

/**
 * RouteForm - טופס להזנת נקודות המסלול
 * מאפשר למשתמש להגדיר נקודת התחלה, יעד ותחנות ביניים
 */
const RouteForm = () => {
  const { 
    startPoint, setStartPoint,
    endPoint, setEndPoint,
    waypoints, setWaypoints,
    waypointInput, setWaypointInput,
    addWaypoint
  } = useContext(TripContext);

  // פונקציה להסרת תחנת ביניים
  const removeWaypoint = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* נקודת התחלה */}
      <Box display="flex" alignItems="center" sx={{ mb: 2 }} role="group" aria-label="נקודת התחלה">
        <TextField
          fullWidth
          id="startPoint"
          name="startPoint"
          label="נקודת ההתחלה"
          value={startPoint}
          onChange={(e) => setStartPoint(e.target.value)}
          sx={{ mr: 1, borderRadius: '8px' }}
          variant="outlined"
          aria-label="נקודת ההתחלה של המסלול"
        />
        <IconButton 
          onClick={addWaypoint} 
          color="primary" 
          sx={{ 
            background: '#4CAF50', 
            color: '#fff', 
            borderRadius: '8px',
            visibility: 'hidden' // משמש רק לשמירת המבנה העיצובי
          }}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* תחנות ביניים */}
      {waypoints.map((wp, index) => (
        <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }} role="group" aria-label={`תחנה ביניים ${index + 1}`}>
          <TextField
            fullWidth
            id={`waypoint-${index}`}
            name={`waypoint-${index}`}
            label={`תחנה ${index + 1}`}
            value={wp}
            onChange={(e) => {
              const newWaypoints = [...waypoints];
              newWaypoints[index] = e.target.value;
              setWaypoints(newWaypoints);
            }}
            sx={{ mr: 1, borderRadius: '8px' }}
            variant="outlined"
            aria-label={`תחנה ביניים ${index + 1}`}
          />
          <IconButton 
            onClick={() => removeWaypoint(index)} 
            color="secondary" 
            sx={{ 
              background: '#f44336', 
              color: '#fff', 
              borderRadius: '8px' 
            }} 
            aria-label={`הסר תחנה ביניים ${index + 1}`}
          >
            <AddIcon sx={{ transform: 'rotate(45deg)' }} />
          </IconButton>
        </Box>
      ))}

      {/* הוספת תחנת ביניים */}
      <Box display="flex" alignItems="center" sx={{ mb: 2 }} role="group" aria-label="הוספת תחנה ביניים">
        <TextField
          fullWidth
          id="waypointInput"
          name="waypointInput"
          label="הוסף תחנה ביניים"
          value={waypointInput}
          onChange={(e) => setWaypointInput(e.target.value)}
          sx={{ mr: 1, borderRadius: '8px' }}
          variant="outlined"
          aria-label="הוסף תחנה ביניים חדשה"
        />
        <IconButton 
          onClick={addWaypoint} 
          color="primary" 
          sx={{ 
            background: '#4CAF50', 
            color: '#fff', 
            borderRadius: '8px' 
          }} 
          aria-label="הוסף תחנה ביניים"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* נקודת יעד */}
      <Box display="flex" alignItems="center" sx={{ mb: 2 }} role="group" aria-label="יעד">
        <TextField
          fullWidth
          id="endPoint"
          name="endPoint"
          label="היעד"
          value={endPoint}
          onChange={(e) => setEndPoint(e.target.value)}
          sx={{ mr: 1, borderRadius: '8px' }}
          variant="outlined"
          aria-label="יעד המסלול"
        />
        <IconButton 
          onClick={addWaypoint} 
          color="primary" 
          sx={{ 
            background: '#4CAF50', 
            color: '#fff', 
            borderRadius: '8px',
            visibility: 'hidden' // משמש רק לשמירת המבנה העיצובי
          }}>
          <AddIcon />
        </IconButton>
      </Box>
    </>
  );
};

export default RouteForm;