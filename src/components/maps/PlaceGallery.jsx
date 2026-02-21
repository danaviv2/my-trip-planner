import React, { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  Typography,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  ZoomIn as ZoomInIcon
} from '@mui/icons-material';

const PlaceGallery = ({ photos, placeName }) => {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const handleOpen = (index) => {
    setSelectedIndex(index);
    setOpen(true);
  };

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* רשת תמונות קטנה */}
      <ImageList cols={3} gap={8} sx={{ width: '100%', mb: 2 }}>
        {photos.slice(0, 6).map((photo, index) => (
          <ImageListItem 
            key={index}
            sx={{ 
              cursor: 'pointer',
              position: 'relative',
              '&:hover': {
                opacity: 0.8,
                '& .zoom-icon': {
                  display: 'flex'
                }
              }
            }}
            onClick={() => handleOpen(index)}
          >
            <img
              src={photo.url}
              alt={`${placeName} ${index + 1}`}
              loading="lazy"
              style={{ 
                height: 100, 
                objectFit: 'cover',
                borderRadius: 8
              }}
            />
            <Box
              className="zoom-icon"
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'none',
                bgcolor: 'rgba(0,0,0,0.6)',
                borderRadius: '50%',
                p: 1
              }}
            >
              <ZoomInIcon sx={{ color: 'white' }} />
            </Box>
          </ImageListItem>
        ))}
      </ImageList>

      {/* דיאלוג תמונה מלאה */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'black',
            boxShadow: 24
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {/* כפתור סגירה */}
          <IconButton
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'rgba(255,255,255,0.9)',
              zIndex: 1,
              '&:hover': { bgcolor: 'white' }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* כפתור הקודם */}
          <IconButton
            onClick={handlePrev}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 10,
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              zIndex: 1,
              '&:hover': { bgcolor: 'white' }
            }}
          >
            <PrevIcon />
          </IconButton>

          {/* כפתור הבא */}
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 10,
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              zIndex: 1,
              '&:hover': { bgcolor: 'white' }
            }}
          >
            <NextIcon />
          </IconButton>

          {/* התמונה */}
          <Box
            component="img"
            src={photos[selectedIndex]?.url}
            alt={`${placeName} ${selectedIndex + 1}`}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />

          {/* מונה תמונות */}
          <Paper
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 2,
              py: 1,
              bgcolor: 'rgba(255,255,255,0.9)'
            }}
          >
            <Typography variant="body2">
              {selectedIndex + 1} / {photos.length}
            </Typography>
          </Paper>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceGallery;
