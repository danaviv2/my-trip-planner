import React from 'react';
import { 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CardActions,
  Button,
  Chip,
  Rating,
  Paper,
  
} from '@mui/material';
import { 
  AccessTime,
  LocalActivity,
  Hiking,
  Restaurant,
  Museum,
  BeachAccess,
  NightShelter,
  DirectionsBoat
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// Map activity types to icons
const activityIcons = {
  hiking: <Hiking />,
  dining: <Restaurant />,
  museum: <Museum />,
  beach: <BeachAccess />,
  nightlife: <NightShelter />,
  boat: <DirectionsBoat />,
  tour: <LocalActivity />
};

const getActivityIcon = (type) => {
  return activityIcons[type] || <LocalActivity />;
};

const RecommendedActivities = ({ activities = [] }) => {
  const { t } = useTranslation();

  if (!activities || activities.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          {t('activities.recommended')}
        </Typography>
        <Typography paragraph>
          {t('activities.noActivities')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {t('activities.recommended')}
      </Typography>
      <Typography paragraph>
        {t('activities.intro')}
      </Typography>

      <Grid container spacing={3}>
        {activities.map((activity) => (
          <Grid item xs={12} md={6} key={activity.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="160"
                image={activity.image}
                alt={activity.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="div">
                    {activity.name}
                  </Typography>
                  <Chip 
                    icon={getActivityIcon(activity.type)} 
                    label={t(`activities.types.${activity.type}`)} 
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={activity.rating} precision={0.5} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({activity.reviewCount})
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {activity.duration}
                  </Typography>
                  <Typography variant="body2" sx={{ mx: 1 }}>•</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('common.from')} ${activity.price}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {activity.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                <Button size="small" color="primary">
                  {t('activities.learnMore')}
                </Button>
                <Button size="small" variant="contained" color="primary">
                  {t('activities.bookNow')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<LocalActivity />}
          href={`/activities`}
        >
          {t('activities.viewAll')}
        </Button>
      </Box>
    </Paper>
  );
};

export default RecommendedActivities;