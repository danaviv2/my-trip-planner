import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  IconButton, 
  Dialog, 
  DialogContent, 
  Paper,
  Skeleton,
  Typography,
  Fade,
  
} from '@mui/material';
import { 
  ArrowBackIos, 
  ArrowForwardIos, 
  Close, 
  ZoomIn,
  
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ImageGallery = ({ images = [] }) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(Array(images.length).fill(false));

  if (!images || images.length === 0) {
    return (
      <Paper elevation={2} sx={{ height: 400, width: '100%', mb: 2 }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Paper>
    );
  }

  const handleImageLoad = (index) => {
    const newLoaded = [...loaded];
    newLoaded[index] = true;
    setLoaded(newLoaded);
  };

  const handlePrevious = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index) => {
    setSelectedImage(index);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <>
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Paper 
          elevation={2} 
          sx={{ 
            height: 400, 
            width: '100%', 
            overflow: 'hidden',
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={handleOpenModal}
        >
          {!loaded[selectedImage] && (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          )}
          <img
            src={images[selectedImage]?.url}
            alt={images[selectedImage]?.caption || t('gallery.image', { number: selectedImage + 1 })}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: loaded[selectedImage] ? 'block' : 'none'
            }}
            onLoad={() => handleImageLoad(selectedImage)}
          />
          
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              p: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Typography variant="body2">
              {images[selectedImage]?.caption || t('gallery.image', { number: selectedImage + 1 })}
            </Typography>
            <Typography variant="body2">
              {selectedImage + 1} / {images.length}
            </Typography>
          </Box>
          
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          >
            <ArrowBackIos />
          </IconButton>
          
          <IconButton
            sx={{
              position: 'absolute',
              top: '50%',
              right: '10px',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <ArrowForwardIos />
          </IconButton>
          
          <IconButton
            sx={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal();
            }}
          >
            <ZoomIn />
          </IconButton>
        </Paper>
      </Box>
      
      {/* Thumbnails */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {images.slice(0, 5).map((image, index) => (
          <Grid item xs={2.4} key={index}>
            <Paper 
              elevation={selectedImage === index ? 4 : 1}
              sx={{ 
                height: 80, 
                overflow: 'hidden',
                cursor: 'pointer',
                border: selectedImage === index ? '2px solid' : 'none',
                borderColor: 'primary.main',
                opacity: selectedImage === index ? 1 : 0.7,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  opacity: 1
                }
              }}
              onClick={() => handleThumbnailClick(index)}
            >
              {!loaded[index] && (
                <Skeleton variant="rectangular" width="100%" height="100%" />
              )}
              <img
                src={image.url}
                alt={image.caption || t('gallery.thumbnail', { number: index + 1 })}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: loaded[index] ? 'block' : 'none'
                }}
                onLoad={() => handleImageLoad(index)}
              />
            </Paper>
          </Grid>
        ))}
        {images.length > 5 && (
          <Grid item xs={2.4}>
            <Paper
              sx={{ 
                height: 80, 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                background: 'rgba(0, 0, 0, 0.5)',
                color: 'white'
              }}
              onClick={handleOpenModal}
            >
              <Typography variant="body2">
                +{images.length - 5} {t('gallery.more')}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Fullscreen Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: 'black', height: '80vh' }}>
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <Close />
          </IconButton>
          
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              top: '50%',
              left: 16,
              transform: 'translateY(-50%)',
              zIndex: 10,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <ArrowBackIos />
          </IconButton>
          
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              top: '50%',
              right: 16,
              transform: 'translateY(-50%)',
              zIndex: 10,
              color: 'white',
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
          >
            <ArrowForwardIos />
          </IconButton>
          
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%'
            }}
          >
            <Fade in={loaded[selectedImage]}>
              <img
                src={images[selectedImage]?.url}
                alt={images[selectedImage]?.caption || t('gallery.image', { number: selectedImage + 1 })}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                onLoad={() => handleImageLoad(selectedImage)}
              />
            </Fade>
          </Box>
          
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Typography>
              {images[selectedImage]?.caption || t('gallery.image', { number: selectedImage + 1 })}
            </Typography>
            <Typography>
              {selectedImage + 1} / {images.length}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageGallery;