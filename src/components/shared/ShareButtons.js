// src/components/shared/ShareButtons.js
import React, { useContext } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FacebookShareButton, TwitterShareButton, EmailShareButton } from 'react-share';
import { useTripContext } from '../../contexts/TripContext';

/**
 * ShareButtons - כפתורי שיתוף מסלול
 */
const ShareButtons = () => {
  const { startPoint, endPoint } = useTripContext();
  
  // URL לשיתוף - יכול להיות מבוסס על מזהה ייחודי של הטיול
  const shareUrl = `https://yourtripplandomain.com/trip?from=${encodeURIComponent(startPoint || '')}&to=${encodeURIComponent(endPoint || '')}&id=${Date.now()}`;

  // טקסט לשיתוף
  const shareTitle = `בוא לראות את המסלול שלי: ${startPoint || ''} -> ${endPoint || ''}`;

  return (
    <Box mt={2} role="group" aria-label="שתף מסלול">
      <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 'bold' }} role="heading" aria-level="2">
        שתף מסלול
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <FacebookShareButton url={shareUrl} quote={shareTitle} hashtag="#TripPlanner">
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#1877F2',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              '&:hover': { background: '#1557B0' },
            }}
            aria-label="שתף ב-Facebook"
          >
            שתף ב-Facebook
          </Box>
        </FacebookShareButton>
        <TwitterShareButton url={shareUrl} title={shareTitle} hashtags={['TripPlanner']}>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#1DA1F2',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              '&:hover': { background: '#0D8BD7' },
            }}
            aria-label="שתף ב-Twitter"
          >
            שתף ב-Twitter
          </Box>
        </TwitterShareButton>
        <EmailShareButton url={shareUrl} subject="מסלול טיול מדהים!" body={`בוא לראות את המסלול שלי: ${startPoint || ''} -> ${endPoint || ''}\nקישור: ${shareUrl}`}>
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              padding: '8px 16px',
              background: '#D44638',
              color: '#fff',
              borderRadius: '8px',
              cursor: 'pointer',
              '&:hover': { background: '#B02F2A' },
            }}
            aria-label="שתף במייל"
          >
            שתף במייל
          </Box>
        </EmailShareButton>
      </Box>
    </Box>
  );
};

export default ShareButtons;