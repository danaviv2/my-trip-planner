import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  TextField, 
  MenuItem, 
  Button, 
  Paper, 
  Box, 
  Stepper, 
  Step, 
  StepLabel,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ייבוא הוק של הפרופיל
import { useUserPreferences } from '../../contexts/UserPreferencesContext';

// סוגי שירותים שניתן להזמין
const serviceTypes = [
  { value: 'flight', label: 'טיסות' },
  { value: 'hotel', label: 'בתי מלון' },
  { value: 'car', label: 'השכרת רכב' },
  { value: 'tour', label: 'סיורים מודרכים' },
  { value: 'attraction', label: 'אטרקציות' }
];

// מדינות פופולריות
const countries = [
  { value: 'israel', label: 'ישראל' },
  { value: 'usa', label: 'ארצות הברית' },
  { value: 'italy', label: 'איטליה' },
  { value: 'france', label: 'צרפת' },
  { value: 'uk', label: 'בריטניה' },
  { value: 'spain', label: 'ספרד' },
  { value: 'greece', label: 'יוון' },
  { value: 'thailand', label: 'תאילנד' },
  { value: 'japan', label: 'יפן' },
  { value: 'other', label: 'אחר' }
];

// שלבי ההזמנה
const steps = ['בחירת שירות', 'פרטי הזמנה', 'פרטי תשלום', 'סיכום'];

const TravelServicesBooking = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // קבלת נתוני העדפות המשתמש מהקונטקסט
  const userPreferencesContext = useUserPreferences() || {};
  const userPrefs = userPreferencesContext.userPreferences || {};
  const updatePreferences = userPreferencesContext.updatePreferences;
  
  // טופס פרטי הזמנה
  const [bookingData, setBookingData] = useState({
    serviceType: userPrefs.preferredServiceType || 'flight',
    destination: userPrefs.lastDestination || '',
    destinationCountry: userPrefs.preferredCountry || 'israel',
    startDate: null,
    endDate: null,
    adults: 1,
    children: 0,
    specialRequests: '',
    budget: '',
    // פרטי תשלום
    fullName: userPrefs.fullName || '',
    email: userPrefs.email || '',
    phone: userPrefs.phone || '',
    paymentMethod: 'credit',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    savePreferences: true
  });

  // שגיאות תיקוף
  const [errors, setErrors] = useState({});
  
  // הודעת הצלחה
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  // טיפול בשינויי שדות
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData({
      ...bookingData,
      [name]: value
    });
    
    // נקה שגיאות בשדה שהשתנה
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // טיפול בשינוי תאריכים
  const handleDateChange = (name, date) => {
    setBookingData({
      ...bookingData,
      [name]: date
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // טיפול בשינוי צ'קבוקס
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setBookingData({
      ...bookingData,
      [name]: checked
    });
  };
  
  // תיקוף נתונים לפי השלב הפעיל
  const validateStep = () => {
    const newErrors = {};
    
    if (activeStep === 0) {
      if (!bookingData.serviceType) {
        newErrors.serviceType = 'אנא בחר סוג שירות';
      }
      if (!bookingData.destination) {
        newErrors.destination = 'אנא הזן יעד';
      }
      if (!bookingData.destinationCountry) {
        newErrors.destinationCountry = 'אנא בחר מדינת יעד';
      }
    }
    else if (activeStep === 1) {
      if (!bookingData.startDate) {
        newErrors.startDate = 'אנא בחר תאריך התחלה';
      }
      if (!bookingData.endDate) {
        newErrors.endDate = 'אנא בחר תאריך סיום';
      }
      if (bookingData.startDate && bookingData.endDate && 
          bookingData.startDate > bookingData.endDate) {
        newErrors.endDate = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
      }
      if (bookingData.adults < 1) {
        newErrors.adults = 'יש לבחור לפחות מבוגר אחד';
      }
    }
    else if (activeStep === 2) {
      if (!bookingData.fullName || bookingData.fullName.length < 2) {
        newErrors.fullName = 'אנא הזן שם מלא';
      }
      if (!bookingData.email || !/\S+@\S+\.\S+/.test(bookingData.email)) {
        newErrors.email = 'אנא הזן כתובת אימייל תקינה';
      }
      if (!bookingData.phone || bookingData.phone.length < 9) {
        newErrors.phone = 'אנא הזן מספר טלפון תקין';
      }
      
      if (bookingData.paymentMethod === 'credit') {
        if (!bookingData.cardNumber || bookingData.cardNumber.length < 16) {
          newErrors.cardNumber = 'אנא הזן מספר כרטיס אשראי תקין';
        }
        if (!bookingData.cardExpiry) {
          newErrors.cardExpiry = 'אנא הזן תאריך תפוגה';
        }
        if (!bookingData.cardCvv || bookingData.cardCvv.length < 3) {
          newErrors.cardCvv = 'אנא הזן קוד אבטחה (CVV)';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // מעבר לשלב הבא
  const handleNext = () => {
    if (validateStep()) {
      if (activeStep === steps.length - 1) {
        handleSubmit();
      } else {
        setActiveStep(activeStep + 1);
      }
    }
  };
  
  // חזרה לשלב הקודם
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  // שליחת הטופס
  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // כאן צריך להיות קוד שמתקשר לשרת ושולח את הנתונים
      // לדוגמה:
      // await api.bookService(bookingData);
      
      // סימולציה של קריאת API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      setOpenSnackbar(true);
      
      // שמירת העדפות משתמש אם נבחר
      if (bookingData.savePreferences && typeof updatePreferences === 'function') {
        try {
          // עדכון העדפות המשתמש
          updatePreferences({
            preferredServiceType: bookingData.serviceType,
            preferredCountry: bookingData.destinationCountry,
            lastDestination: bookingData.destination,
            fullName: bookingData.fullName,
            email: bookingData.email,
            phone: bookingData.phone
          });
        } catch (error) {
          console.log('לא ניתן לעדכן העדפות משתמש');
        }
      }
      
      // חזרה לדף הבית אחרי 3 שניות
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('שגיאה בשליחת הטופס:', error);
      setErrors({
        ...errors,
        submit: 'אירעה שגיאה בשליחת הטופס, אנא נסה שנית'
      });
    }
    
    setLoading(false);
  };
  
  // סגירת הודעת הצלחה
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  // תצוגת השלב הנוכחי
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="סוג שירות"
                name="serviceType"
                value={bookingData.serviceType}
                onChange={handleChange}
                error={!!errors.serviceType}
                helperText={errors.serviceType}
                required
              >
                {serviceTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="מדינה"
                name="destinationCountry"
                value={bookingData.destinationCountry}
                onChange={handleChange}
                error={!!errors.destinationCountry}
                helperText={errors.destinationCountry}
                required
              >
                {countries.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="יעד ספציפי"
                name="destination"
                value={bookingData.destination}
                onChange={handleChange}
                placeholder="עיר, אזור, מלון..."
                error={!!errors.destination}
                helperText={errors.destination}
                required
              />
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="תאריך התחלה"
                  value={bookingData.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.startDate}
                      helperText={errors.startDate}
                    />
                  )}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
                <DatePicker
                  label="תאריך סיום"
                  value={bookingData.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.endDate}
                      helperText={errors.endDate}
                    />
                  )}
                  minDate={bookingData.startDate || new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                fullWidth
                label="מספר מבוגרים"
                name="adults"
                value={bookingData.adults}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 1, max: 10 } }}
                error={!!errors.adults}
                helperText={errors.adults}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                fullWidth
                label="מספר ילדים"
                name="children"
                value={bookingData.children}
                onChange={handleChange}
                InputProps={{ inputProps: { min: 0, max: 10 } }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="תקציב משוער (₪)"
                name="budget"
                type="number"
                value={bookingData.budget}
                onChange={handleChange}
                placeholder="אופציונלי"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="בקשות מיוחדות"
                name="specialRequests"
                value={bookingData.specialRequests}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="דרישות תזונה מיוחדות, העדפות חדר, צרכי נגישות..."
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="שם מלא"
                name="fullName"
                value={bookingData.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="אימייל"
                name="email"
                type="email"
                value={bookingData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="טלפון"
                name="phone"
                value={bookingData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                פרטי תשלום
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="אמצעי תשלום"
                name="paymentMethod"
                value={bookingData.paymentMethod}
                onChange={handleChange}
              >
                <MenuItem value="credit">כרטיס אשראי</MenuItem>
                <MenuItem value="paypal">PayPal</MenuItem>
                <MenuItem value="transfer">העברה בנקאית</MenuItem>
              </TextField>
            </Grid>
            
            {bookingData.paymentMethod === 'credit' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="מספר כרטיס אשראי"
                    name="cardNumber"
                    value={bookingData.cardNumber}
                    onChange={handleChange}
                    error={!!errors.cardNumber}
                    helperText={errors.cardNumber}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="תוקף (MM/YY)"
                    name="cardExpiry"
                    value={bookingData.cardExpiry}
                    onChange={handleChange}
                    placeholder="MM/YY"
                    error={!!errors.cardExpiry}
                    helperText={errors.cardExpiry}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="קוד אבטחה (CVV)"
                    name="cardCvv"
                    value={bookingData.cardCvv}
                    onChange={handleChange}
                    error={!!errors.cardCvv}
                    helperText={errors.cardCvv}
                    required
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bookingData.savePreferences}
                    onChange={handleCheckboxChange}
                    name="savePreferences"
                    color="primary"
                  />
                }
                label="שמור את העדפותיי לפעם הבאה"
              />
            </Grid>
          </Grid>
        );
      
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              סיכום הזמנה
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  פרטי שירות
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      סוג שירות:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {serviceTypes.find(s => s.value === bookingData.serviceType)?.label || bookingData.serviceType}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      יעד:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.destination} ({countries.find(c => c.value === bookingData.destinationCountry)?.label || bookingData.destinationCountry})
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  פרטי נוסעים ותאריכים
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      תאריכים:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.startDate?.toLocaleDateString()} - {bookingData.endDate?.toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      מספר נוסעים:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.adults} מבוגרים, {bookingData.children} ילדים
                    </Typography>
                  </Grid>
                  
                  {bookingData.specialRequests && (
                    <>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          בקשות מיוחדות:
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">
                          {bookingData.specialRequests}
                        </Typography>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  פרטי התקשרות ותשלום
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      שם מלא:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.fullName}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      אימייל:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.email}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      טלפון:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.phone}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      אמצעי תשלום:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      {bookingData.paymentMethod === 'credit' 
                        ? 'כרטיס אשראי' 
                        : bookingData.paymentMethod === 'paypal' 
                          ? 'PayPal' 
                          : 'העברה בנקאית'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {errors.submit && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errors.submit}
              </Alert>
            )}
          </Box>
        );
      
      default:
        return 'שלב לא ידוע';
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 3 }}>
          הזמנת שירותי נסיעה
        </Typography>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mb: 4 }}>
          {success ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                ההזמנה שלך התקבלה בהצלחה!
              </Typography>
              <Typography variant="body1" paragraph>
                אישור יישלח לכתובת האימייל שציינת: {bookingData.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                מועבר לדף הבית...
              </Typography>
              <CircularProgress sx={{ mt: 2 }} />
            </Box>
          ) : (
            <>
              {getStepContent(activeStep)}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  חזרה
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {activeStep === steps.length - 1 ? (
                    loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'שלח הזמנה'
                    )
                  ) : (
                    'המשך'
                  )}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ההזמנה שלך התקבלה בהצלחה!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TravelServicesBooking;