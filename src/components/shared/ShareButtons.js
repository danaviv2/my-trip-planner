// src/components/shared/ShareButtons.js
// עטיפה תאימות — מפנה ל-ShareTripDialog המאוחד
import React, { useState } from 'react';
import { Button } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ShareTripDialog from './ShareTripDialog';

const ShareButtons = ({ destination = '', days, budget, startDate }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<ShareIcon />}
        onClick={() => setOpen(true)}
        sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      >
        שתף טיול
      </Button>
      <ShareTripDialog
        open={open}
        onClose={() => setOpen(false)}
        trip={{ destination, days, budget, startDate }}
      />
    </>
  );
};

export default ShareButtons;
