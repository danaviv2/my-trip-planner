// components/travel-info/EmailImportModal.js
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseTravelDocument } from '../../services/bookingParserService';
import { useBookings } from '../../contexts/BookingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { scanMailbox } from '../../services/bookingScanService';
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

const EmailImportModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { addBookings, applyCancellations } = useBookings();
  const { gmailToken, connectGmail, disconnectGmail, refreshGmailToken } = useAuth();
  const [scanProgress, setScanProgress] = useState('');
  const [scannedSubjects, setScannedSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // טיפול בשינוי לשוניות
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  /**
   * סורק את תיבת ה-Gmail, מפענח כל אישור שנמצא ומייבא אותו.
   * ההרשאה היא קריאה בלבד, ותוכן המיילים אינו נשמר — רק פרטי ההזמנה.
   */
  const connectToGmail = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setScanProgress('');
    setScannedSubjects([]);

    try {
      const token = gmailToken || (await connectGmail());

      const scan = (t) =>
        scanMailbox(t, {
          maxResults: 60,
          monthsBack: 12,
          onProgress: (msg) => setScanProgress(msg),
        });

      // טוקן תקף לשעה, ולכן חזרה לאפליקציה למחרת נתקלת בטוקן שפג. זהו
      // מצב צפוי: מנפיקים חדש בשקט וממשיכים. עד כה הוצגה כאן הודעה
      // שביקשה מהמשתמש להתחבר מחדש, וההסכמה נמחקה יחד איתה.
      let result;
      try {
        result = await scan(token);
      } catch (e) {
        if (e.message !== 'GMAIL_TOKEN_EXPIRED') throw e;
        setScanProgress('מחדש את ההרשאה...');
        result = await scan(await refreshGmailToken());
      }

      const { bookings: collected, cancellations, parsed, fromPdf, matched, unrecognized, alreadyKnown } = result;

      // מוצג תמיד ולא רק בכישלון: סריקה יכולה להצליח ועדיין להחמיץ את
      // אישור המלון, ובלי הרשימה אין דרך לדעת שהוא הוחמץ.
      setScannedSubjects(unrecognized || []);

      if (!matched) {
        setError('לא נמצאו אישורי הזמנה בשנה האחרונה. אפשר להדביק מייל ידנית בלשונית הראשונה.');
        return;
      }

      if (!collected.length) {
        setError(
          `נסרקו ${matched} מיילים אך לא זוהו בהם אישורי הזמנה. ייתכן שהחיפוש תפס מיילים שיווקיים. ראה את הרשימה למטה.`
        );
        return;
      }

      const { added, skipped } = await addBookings(collected);
      // מבוצע אחרי ההוספה: אישור וביטול עשויים להגיע באותה סריקה, וסדר
      // הפוך היה מוסיף חזרה הזמנה שזה עתה בוטלה.
      const removed = await applyCancellations(cancellations || []);
      const dup = skipped > 0 ? ` ${skipped} כבר היו במערכת.` : '';
      const canc = removed > 0 ? ` ${removed} הזמנות שבוטלו הוסרו.` : '';
      const missed = unrecognized?.length
        ? ` ${unrecognized.length} מיילים לא זוהו — ראה את הרשימה למטה.`
        : '';
      // החיסכון נאמר במפורש: סריקה שמדלגת בשקט נראית כסריקה שלא עבדה.
      const cached = alreadyKnown > 0
        ? ` ${alreadyKnown} מיילים נסרקו בעבר ולא פוענחו שוב.`
        : '';
      setSuccess(
        `נסרקו ${matched} מיילים, זוהו ${parsed} אישורים${fromPdf ? ` (${fromPdf} מתוך קבצים מצורפים)` : ''}, ויובאו ${added} הזמנות חדשות.${dup}${canc}${cached}${missed}`
      );
    } catch (err) {
      if (err.message === 'GMAIL_TOKEN_EXPIRED') {
        // ההנפקה השקטה נכשלה גם היא — סימן שההרשאה עצמה כבר לא בתוקף
        disconnectGmail();
        setError('ההרשאה לגישה לתיבה כבר אינה בתוקף. לחץ שוב כדי לאשר מחדש.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('חלון ההרשאה נסגר לפני האישור.');
      } else if (err.message === 'GMAIL_FORBIDDEN') {
        setError('הגישה ל-Gmail נדחתה. ודא שאישרת את ההרשאה במסך של גוגל.');
      } else {
        setError('שגיאה בסריקת התיבה: ' + err.message);
      }
    } finally {
      setIsLoading(false);
      setScanProgress('');
    }
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
      // הכתיבה לטפסים הידניים הוסרה יחד איתם: היא הזינה מודל נתונים
      // מקביל שאיש לא קרא. addBookings למטה הוא המסלול היחיד.
      if (result.flights.length) parts.push(`${result.flights.length} טיסות`);
      if (result.carRental) parts.push('השכרת רכב');
      if (result.hotel) {
        parts.push(`לינה ב${result.hotel.name || 'מלון'}`);
      }

      // שמירה למאגר ההזמנות. משם הן מקובצות אוטומטית לטיולים, כך
      // שאישורים שמגיעים בנפרד מתאחדים לנסיעה אחת.
      const toStore = [
        ...result.flights.map((f) => ({ ...f, type: 'flight', direction: f.type })),
        ...(result.carRental ? [{ ...result.carRental, type: 'car_rental' }] : []),
        ...(result.hotel ? [{ ...result.hotel, type: 'hotel' }] : []),
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

        {/* סריקת תיבה עשויה להימשך דקה — חיווי שקוף עדיף על ספינר אילם */}
        {scanProgress && (
          <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 2 }}>
            {scanProgress}
          </Alert>
        )}

        {/* כשלא נמצאו הזמנות — מציגים מה כן נסרק, כדי שאפשר יהיה לכוונן
            את שאילתת החיפוש במקום לנחש */}
        {scannedSubjects.length > 0 && (
          <Box sx={{ mb: 2, maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
              מיילים שלא זוהו כהזמנה ({scannedSubjects.length}):
            </Typography>
            {scannedSubjects.map((e, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                • {e.subject || '(ללא נושא)'}
                {e.reason && <span style={{ opacity: 0.75 }}> — {e.reason}</span>}
              </Typography>
            ))}
          </Box>
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