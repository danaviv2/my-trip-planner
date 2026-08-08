// components/travel-info/EmailImportModal.js
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseTravelDocument } from '../../services/bookingParserService';
import { useBookings } from '../../contexts/BookingsContext';
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
  const { t } = useTranslation();
  const { addBookings } = useBookings();
  const [activeTab, setActiveTab] = useState(0);
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // טיפול בשינוי לשוניות
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // חיבור Gmail דורש זרימת OAuth שטרם מומשה. עד אז מציגים הודעה כנה
  // ומפנים ללשונית ההדבקה, במקום להזריק נתוני דמה ולהצהיר על הצלחה.
  const connectToGmail = async () => {
    setError('חיבור אוטומטי ל-Gmail עדיין לא זמין. בינתיים העתק את גוף המייל והדבק אותו בלשונית "העתק/הדבק מייל".');
  };
  
  // פונקציה לחילוץ פרטים מטקסט מייל
  const extractDataFromEmail = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!emailContent.trim()) {
      setError('הדבק תחילה את תוכן המייל.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await parseTravelDocument(emailContent);

      if (!result.isBooking) {
        setError('לא זוהו פרטי הזמנה בטקסט שהודבק. ודא שהעתקת את גוף המייל המלא של אישור ההזמנה.');
        setIsLoading(false);
        return;
      }

      const parts = [];
      if (result.flights.length) {
        setFlights(result.flights);
        parts.push(`${result.flights.length} טיסות`);
      }
      if (result.carRental) {
        setCarRental(result.carRental);
        parts.push('השכרת רכב');
      }

      // שמירה למאגר ההזמנות. משם הן מקובצות אוטומטית לטיולים, כך
      // שאישורים שמגיעים בנפרד מתאחדים לנסיעה אחת.
      const toStore = [
        ...result.flights.map((f) => ({ ...f, type: 'flight', direction: f.type })),
        ...(result.carRental ? [{ ...result.carRental, type: 'car_rental' }] : []),
      ];
      const { added, skipped } = await addBookings(toStore);

      const dupNote = skipped > 0 ? ` ${skipped} כבר היו קיימות.` : '';
      const tripNote = added > 0 ? ' ההזמנות שויכו לטיול אוטומטית.' : '';
      setSuccess(`נמצאו ויובאו: ${parts.join(' ו-')}.${dupNote}${tripNote} בדוק את הפרטים לפני שמירה.`);
    } catch (err) {
      setError(
        err.message === 'PARSE_FAILED'
          ? 'לא הצלחנו לפענח את התשובה. נסה שוב, או הדבק קטע קצר יותר.'
          : 'שגיאה בחילוץ הפרטים: ' + err.message
      );
    } finally {
      setIsLoading(false);
    }
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
          {t('travelInfoPage.import_title')}
        </Typography>
        
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label={t('travelInfoPage.tab_paste')} />
          <Tab label={t('travelInfoPage.tab_gmail')} />
          <Tab label={t('travelInfoPage.tab_file')} />
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
              {t('travelInfoPage.paste_instructions')}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={8}
              placeholder={t('travelInfoPage.paste_placeholder')}
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
                {t('travelInfoPage.cancel')}
              </Button>
              <Button 
                variant="contained"
                onClick={extractDataFromEmail}
                disabled={!emailContent.trim() || isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : t('travelInfoPage.extract')}
              </Button>
            </Box>
          </>
        )}
        
        {activeTab === 1 && (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t('travelInfoPage.gmail_instructions')}
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
                {t('travelInfoPage.gmail_click_text')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                {t('travelInfoPage.gmail_search_text')}
              </Typography>
              
              <Button 
                variant="contained"
                color="primary"
                startIcon={<i className="material-icons">login</i>}
                onClick={connectToGmail}
                disabled={isLoading}
                sx={{ mb: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : t('travelInfoPage.connect_gmail')}
              </Button>
              
              <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                {t('travelInfoPage.privacy_note')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onClose}>
                {t('travelInfoPage.close')}
              </Button>
            </Box>
          </>
        )}

        {activeTab === 2 && (
          <>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {t('travelInfoPage.file_instructions')}
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
                accept=".eml,.txt"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  setError('');
                  setSuccess('');
                  // PDF דורש ספריית פענוח ולכן אינו נתמך כרגע — עדיף לומר זאת
                  // מאשר להעמיד פנים שהקובץ נקרא.
                  if (/\.pdf$/i.test(file.name)) {
                    setError('קבצי PDF עדיין לא נתמכים. פתח את המייל, העתק את גוף ההודעה והדבק בלשונית "העתק/הדבק מייל".');
                    return;
                  }
                  try {
                    const text = await file.text();
                    setEmailContent(text);
                    setActiveTab(0);
                    setSuccess('הקובץ נטען. לחץ "חלץ פרטים" כדי לעבד אותו.');
                  } catch (err) {
                    setError('לא הצלחנו לקרוא את הקובץ: ' + err.message);
                  }
                }}
              />
              <i className="material-icons" style={{ fontSize: '48px', color: '#ccc' }}>cloud_upload</i>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                {t('travelInfoPage.upload_click')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                {t('travelInfoPage.file_types')}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onClose}>
                {t('travelInfoPage.close')}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default EmailImportModal;