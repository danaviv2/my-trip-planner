// components/travel-info/EmailImportModal.js
import React, { useState } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Tabs, 
  Tab, 
  CircularProgress,
  Alert
} from '@mui/material';

const EmailImportModal = ({ open, onClose, setFlights, setCarRental }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // טיפול בשינוי לשוניות
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // פונקציה לחיבור Gmail עם OAuth
  const connectToGmail = async () => {
    setIsLoading(true);
    setError('');
    try {
      // הערה: כאן יהיה צורך להוסיף את קוד OAuth אמיתי
      // לצורך הדוגמה, נדמה הצלחה
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('החיבור לחשבון Gmail הצליח! ניתן לייבא פרטים.');
      
      // כאן באמת תשלוף הודעות email ותחלץ מהן מידע
      // לצורך הדגמה, נשתמש בנתונים לדוגמה
      simulateEmailImport();
    } catch (error) {
      setError('שגיאה בחיבור ל-Gmail: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // פונקציה לחילוץ פרטים מטקסט מייל
  const extractDataFromEmail = () => {
    setIsLoading(true);
    setError('');
    
    try {
      // כאן יהיה אלגוריתם אמיתי לחילוץ נתונים
      // לצורך הדגמה, נדמה עיבוד
      setTimeout(() => {
        simulateEmailImport();
        setIsLoading(false);
        setSuccess('נמצאו ונשלפו פרטי טיסה והשכרת רכב!');
      }, 1500);
    } catch (error) {
      setError('שגיאה בעיבוד תוכן האימייל: ' + error.message);
      setIsLoading(false);
    }
  };
  
  // סימולציה של ייבוא מוצלח
  const simulateEmailImport = () => {
    // דוגמה לטיסות שחולצו
    setFlights([
      { 
        id: 1, 
        type: 'departure', 
        flightNumber: 'LY315', 
        airline: 'אל על', 
        date: '2025-04-15', 
        departureTime: '12:30', 
        departureAirport: 'TLV', 
        arrivalTime: '16:45', 
        arrivalAirport: 'CDG', 
        terminal: 'T3' 
      },
      { 
        id: 2, 
        type: 'return', 
        flightNumber: 'LY318', 
        airline: 'אל על', 
        date: '2025-04-22', 
        departureTime: '09:15', 
        departureAirport: 'CDG', 
        arrivalTime: '14:30', 
        arrivalAirport: 'TLV', 
        terminal: 'T2E' 
      }
    ]);
    
    // דוגמה לפרטי השכרת רכב שחולצו
    setCarRental({
      company: 'Hertz',
      pickupDate: '2025-04-15',
      pickupTime: '17:30',
      pickupLocation: 'נמל התעופה שארל דה גול, פריז',
      returnDate: '2025-04-22',
      returnTime: '06:30',
      returnLocation: 'נמל התעופה שארל דה גול, פריז',
      carType: 'Peugeot 208 או דומה',
      confirmationNumber: 'HR123456789'
    });
  };
  
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="email-import-modal-title"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '600px',
        bgcolor: 'background.paper',
        borderRadius: '12px',
        boxShadow: 24,
        p: 4,
        textAlign: 'right',
        direction: 'rtl'
      }}>
        <Typography id="email-import-modal-title" variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          ייבוא פרטי נסיעה
        </Typography>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="העתק/הדבק מייל" />
          <Tab label="חיבור לג'ימייל" />
          <Tab label="ייבוא מקובץ" />
        </Tabs>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        {activeTab === 0 && (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              העתק והדבק את תוכן האימייל עם פרטי ההזמנה שלך:
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={8}
              placeholder="הדבק כאן את תוכן המייל עם פרטי ההזמנה..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={onClose}
                sx={{ ml: 2 }}
              >
                ביטול
              </Button>
              <Button 
                variant="contained"
                onClick={extractDataFromEmail}
                disabled={!emailContent.trim() || isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'חלץ פרטים'}
              </Button>
            </Box>
          </>
        )}
        
        {activeTab === 1 && (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              חיבור ישיר לתיבת הג'ימייל שלך לחילוץ פרטי הזמנה:
            </Typography>
            
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              borderRadius: '8px', 
              bgcolor: '#f5f5f5',
              textAlign: 'center'
            }}>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" 
                alt="Gmail Logo" 
                style={{ width: '48px', height: '48px', marginBottom: '16px' }} 
              />
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                לחץ על הכפתור למטה כדי להתחבר לחשבון הג'ימייל שלך
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                האפליקציה תחפש הודעות עם הזמנות טיסה והשכרת רכב
              </Typography>
              
              <Button 
                variant="contained"
                color="primary"
                startIcon={<i className="material-icons">login</i>}
                onClick={connectToGmail}
                disabled={isLoading}
                sx={{ mb: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'התחבר לג\'ימייל'}
              </Button>
              
              <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                * המידע לא נשמר בשרתים שלנו ומשמש רק לחילוץ פרטי הנסיעה שלך
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onClose}>
                סגור
              </Button>
            </Box>
          </>
        )}
        
        {activeTab === 2 && (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              העלה קובץ אישור הזמנה (PDF או אימייל שנשמר):
            </Typography>
            
            <Box 
              sx={{ 
                border: '2px dashed #ccc', 
                borderRadius: '8px', 
                p: 4, 
                textAlign: 'center', 
                mb: 3,
                cursor: 'pointer',
                '&:hover': { borderColor: '#2196F3' }
              }}
              onClick={() => document.getElementById('fileUpload').click()}
            >
              <input
                type="file"
                id="fileUpload"
                style={{ display: 'none' }}
                accept=".pdf,.eml,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    // כאן יהיה קוד אמיתי לקריאת הקובץ
                    simulateEmailImport();
                    setSuccess('הקובץ נקרא בהצלחה!');
                  }
                }}
              />
              <i className="material-icons" style={{ fontSize: '48px', color: '#ccc' }}>cloud_upload</i>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                לחץ להעלאת קובץ או גרור לכאן
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                תומך בקבצי PDF, EML או TXT
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onClose}>
                סגור
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default EmailImportModal;