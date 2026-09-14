// components/travel-info/EmailImportModal.js
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseTravelDocument, parseTravelDocumentFromFile } from '../../services/bookingParserService';
import { documentKind, prepareDocument } from '../../utils/documentUpload';
import { useBookings } from '../../contexts/BookingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { scanMailbox, toBookings } from '../../services/bookingScanService';
import useGmailDisclosure from '../consent/useGmailDisclosure';
import { setGmailConsent } from '../../services/googleTokenClient';
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
  const { gmailToken, connectGmail, clearGmailToken, refreshGmailToken } = useAuth();
  const { ensureGmailDisclosure, gmailDisclosureDialog } = useGmailDisclosure();
  const [scanProgress, setScanProgress] = useState('');
  const [dragOver, setDragOver] = useState(false);
  // מצלמה רק במכשיר מגע: במחשב `capture` מתעלם ופותח בחירת קובץ, וכפתור
  // "צלם" שפותח חלון קבצים מבטיח משהו שאינו קורה.
  const hasTouch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const [scannedSubjects, setScannedSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // ── הודעה אחת עם חומרה, במקום error/success נפרדים ──
  // בשני משתנים נפרדים קיימות רק שתי חומרות, ולכן המצב השלישי —
  // "סרקנו, הכול תקין, ואין מה להוסיף" — נאלץ להתחזות לאחד מהם. בפועל
  // הוא הוצג באדום: משתמש חוזר שכל המיילים שלו כבר נסרקו ראה שגיאה.
  // `detail` נושא את הטקסט הטכני, שאינו נכנס לגוף ההודעה.
  const [notice, setNotice] = useState(null); // {severity, text, detail}
  const clearNotice = () => setNotice(null);

  // כשל רשת נראה זהה בשני המסלולים, ולכן מזוהה במקום אחד. עד כה הזיהוי
  // ישב רק בסריקת Gmail, ובהדבקה אותו כשל בדיוק הוצג כהודעה גנרית.
  const isNetworkError = (msg) => /failed to fetch|networkerror|load failed|err_internet/i.test(msg);

  // איפוס בהחלפת לשונית: הודעה על סריקת Gmail שנותרת על המסך בלשונית
  // ההדבקה נקראת כתשובה על ההדבקה. הטקסט שהוקלד נשמר בכוונה.
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    clearNotice();
    setScannedSubjects([]);
  };

  /**
   * סורק את תיבת ה-Gmail, מפענח כל אישור שנמצא ומייבא אותו.
   * ההרשאה היא קריאה בלבד, ותוכן המיילים אינו נשמר — רק פרטי ההזמנה.
   */
  const connectToGmail = async () => {
    // הגילוי לפני כל דבר אחר — גם כשיש כבר טוקן: הרשאה שניתנה לפני שהגילוי
    // היה קיים אינה הסכמה לשליחת המיילים ל-Gemini.
    if (!(await ensureGmailDisclosure())) return;
    setIsLoading(true);
    clearNotice();
    setScanProgress('');
    setScannedSubjects([]);

    try {
      const token = gmailToken || (await connectGmail());

      // הפרמטר נקרא בעבר `t` והסתיר את פונקציית התרגום בתוך הסוגר הזה
      const scan = (tok) =>
        scanMailbox(tok, {
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
        setScanProgress(t('emailImport.progress.renewing'));
        result = await scan(await refreshGmailToken());
      }

      const { bookings: collected, cancellations, parsed, fromPdf, matched, unrecognized, alreadyKnown, schemaDeclared = 0 } = result;

      // מוצג תמיד ולא רק בכישלון: סריקה יכולה להצליח ועדיין להחמיץ את
      // אישור המלון, ובלי הרשימה אין דרך לדעת שהוא הוחמץ.
      setScannedSubjects(unrecognized || []);

      // ── שלושת המצבים מופרדים כאן ──
      // `matched` נספר ב-gmailService אחרי סינון המיילים שכבר נסרקו
      // (שם: `matched = ids.length`, אחרי `filter(skipIds)`). לכן משתמש
      // חוזר שכל תיבתו מוכרת מקבל matched=0, ועד כה ראה שגיאה אדומה
      // "לא נמצאו אישורי הזמנה" בזמן ש-alreadyKnown גדול מאפס באותו
      // אובייקט עצמו. היעדר חדש אינו היעדר, ואף אחד משניהם אינו כשל.
      if (!matched) {
        setNotice(alreadyKnown > 0
          ? { severity: 'info', text: t('emailImport.allCached') }
          : { severity: 'warning', text: t('emailImport.noneFound') });
        return;
      }

      if (!collected.length) {
        setNotice({ severity: 'warning', text: t('emailImport.scannedNoBookings', { n: matched }) });
        return;
      }

      const { added, skipped } = await addBookings(collected);
      // מבוצע אחרי ההוספה: אישור וביטול עשויים להגיע באותה סריקה, וסדר
      // הפוך היה מוסיף חזרה הזמנה שזה עתה בוטלה.
      const removed = await applyCancellations(cancellations || []);

      // כל שורה כאן נגזרת ממה שקרה בפועל, ומושמטת כשהמספר אפס.
      const extras = [
        skipped > 0 && t('emailImport.success.merged', { n: skipped }),
        removed > 0 && t('emailImport.success.cancelled', { n: removed }),
        // החיסכון נאמר במפורש: סריקה שמדלגת בשקט נראית כסריקה שלא עבדה.
        alreadyKnown > 0 && t('emailImport.success.cached', { n: alreadyKnown }),
        unrecognized?.length && t('emailImport.success.missed', { n: unrecognized.length }),
      ].filter(Boolean);

      // מדדי הפענוח יורדים ל-detail ולא לגוף ההודעה. `schemaDeclared`
      // נמדד בכוונה — ההחלטה עד כמה להישען על הסימון המובנה חייבת
      // להתבסס על תיבה אמיתית — אך הוא מדד למפתח, לא משפט למשתמש.
      const detail = [
        `parsed ${parsed}`,
        fromPdf > 0 && `fromPdf ${fromPdf}`,
        schemaDeclared > 0 && `schema.org ${schemaDeclared}`,
      ].filter(Boolean).join(' · ');

      // ייבוא שלא הוסיף דבר אינו הצלחה ואינו כשל: הכול כבר היה כאן.
      // ההפרדה נחוצה כי הסריקה השנייה ברציפות מגיעה לכאן כמעט תמיד.
      setNotice(added > 0
        ? {
            severity: 'success',
            text: [t('emailImport.success.headline', { added, matched }), ...extras].join(' '),
            detail,
          }
        : {
            severity: 'info',
            text: [t('emailImport.nothingNew', { matched }), ...extras].join(' '),
            detail,
          });
    } catch (err) {
      // כל ענף מסתיים בפעולה שאפשר לבצע. המודל נשאר פתוח בכל אחד מהם.
      const msg = String(err?.message || '');
      if (msg === 'GMAIL_TOKEN_EXPIRED') {
        // ההנפקה השקטה נכשלה גם היא — סימן שההרשאה עצמה כבר לא בתוקף.
        // לא `disconnectGmail`: הוא מנסה לשלול אצל Google, ואין מה לשלול —
        // רק עוד ניסיון שקט שנכשל אחרי 8 שניות.
        clearGmailToken();
        setGmailConsent(false);
        setNotice({ severity: 'warning', text: t('emailImport.error.consentExpired') });
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setNotice({ severity: 'info', text: t('emailImport.error.popupClosed') });
      } else if (msg === 'GMAIL_FORBIDDEN') {
        setNotice({ severity: 'error', text: t('emailImport.error.forbidden') });
      } else if (isNetworkError(msg)) {
        // כשל רשת אינו כשל של התיבה, ואסור שייקרא כ"אין לך הזמנות"
        setNotice({ severity: 'error', text: t('emailImport.error.network'), detail: msg });
      } else {
        // הטקסט הטכני יורד ל-detail: הוא נחוץ לדיווח תקלה, אבל בגוף
        // ההודעה הוא הפך משפט מובן לשרשור של קוד שגיאה.
        setNotice({ severity: 'error', text: t('emailImport.error.scanFailed'), detail: msg });
      }
    } finally {
      setIsLoading(false);
      setScanProgress('');
    }
  };
  
  // "טיסה אחת · שתי לינות" — משותף להדבקה ולהעלאת קבצים, כדי שהסיכום לא
  // יתפצל לשני ניסוחים שמתקנים אחד מהם בלבד.
  const summarizeTypes = (list) => {
    const TYPES = ['flight', 'hotel', 'car_rental', 'transfer', 'activity', 'restaurant', 'insurance'];
    const counts = list.reduce((acc, b) => {
      const key = TYPES.includes(b.type) ? b.type : 'other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .map(([key, n]) => t(`emailImport.type.${key}`, { count: n }))
      .join(' · ');
  };

  /**
   * העלאת מסמכים: PDF, צילום מסך או צילום מהמצלמה.
   *
   * עד 14.09.2026 הלשונית קיבלה EML ו-TXT בלבד, ו-PDF נדחה בהודעה. זה היה
   * המסלול היחיד שעובד לכל משתמש — סריקת Gmail חסומה לציבור עד אימות Google
   * (STATUS סעיף 9) — וגם הוא לא קרא את הצורה שבה רוב האישורים באמת נמצאים.
   *
   * כל קובץ מפוענח לחוד, והשמירה נעשית פעם אחת בסוף: יציאה ברבע הדרך לא
   * משאירה חצי ייבוא, והסיכום מונה מה נשמר בפועל ולא מה נשלח.
   */
  const importFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    clearNotice();

    // EML/TXT נשארים במסלול הקיים: טעינה לשדה ההדבקה, קובץ אחד.
    const textFile = files.find((f) => documentKind(f).kind === 'text');
    if (textFile && files.length === 1) {
      try {
        setEmailContent(await textFile.text());
        setActiveTab(0);
        setNotice({ severity: 'success', text: t('emailImport.file.loaded', { action: t('travelInfoPage.extract') }) });
      } catch (err) {
        setNotice({ severity: 'error', text: t('emailImport.error.fileRead'), detail: String(err?.message || '') });
      }
      return;
    }

    setIsLoading(true);
    const collected = [];
    const notBooking = [];
    const failed = [];
    let lastError = '';
    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        setScanProgress(t('emailImport.upload.reading', { name: file.name, i: i + 1, n: files.length }));
        try {
          const { base64, mime } = await prepareDocument(file);
          const result = await parseTravelDocumentFromFile(base64, mime);
          if (!result.isBooking || result.cancelled) { notBooking.push(file.name); continue; }
          const records = toBookings(result, { sourceSubject: file.name, sourceKind: 'upload' });
          if (records.length) collected.push(...records); else notBooking.push(file.name);
        } catch (err) {
          const code = String(err?.message || '');
          lastError = code;
          failed.push(`${file.name} (${
            code === 'TOO_LARGE' ? t('emailImport.upload.tooLarge')
              : code === 'UNSUPPORTED_TYPE' ? t('emailImport.upload.unsupported')
              : isNetworkError(code) ? t('emailImport.upload.network')
              : t('emailImport.upload.failed')
          })`);
        }
      }

      const { added = 0, skipped = 0 } = collected.length ? await addBookings(collected) : {};
      const lines = [
        added > 0 && t('emailImport.paste.success', { parts: summarizeTypes(collected) }),
        added === 0 && collected.length > 0 && t('emailImport.upload.allKnown'),
        skipped > 0 && t('emailImport.success.merged', { n: skipped }),
        notBooking.length > 0 && t('emailImport.upload.notBooking', { names: notBooking.join(', ') }),
        failed.length > 0 && t('emailImport.upload.someFailed', { names: failed.join(', ') }),
      ].filter(Boolean);

      // החומרה נגזרת ממה שקרה: שמירה = הצלחה, כלום-ובלי-כשל = אזהרה, רק כשלים = שגיאה.
      const severity = added > 0 ? 'success'
        : collected.length > 0 ? 'info'
        : failed.length === files.length ? 'error'
        : 'warning';
      setNotice({ severity, text: lines.join(' '), detail: lastError || undefined });
    } finally {
      setIsLoading(false);
      setScanProgress('');
    }
  };

  // פונקציה לחילוץ פרטים מטקסט מייל
  const extractDataFromEmail = async () => {
    setIsLoading(true);
    clearNotice();

    if (!emailContent.trim()) {
      setNotice({ severity: 'info', text: t('travelInfoPage.paste_instructions') });
      setIsLoading(false);
      return;
    }

    try {
      const result = await parseTravelDocument(emailContent);

      // המודל קרא והכריע שאין כאן הזמנה. זו תשובה, לא תקלה — הטקסט
      // שהוקלד נשאר בשדה כדי שאפשר יהיה להשלים אותו במקום להתחיל מחדש.
      if (!result.isBooking) {
        setNotice({ severity: 'warning', text: t('emailImport.paste.notABooking') });
        setIsLoading(false);
        return;
      }

      // ── בעלים אחד להמרה ──
      // כאן ישבה רשימה משלה ובה טיסות, רכב ומלון בלבד. אטרקציות, ביטוח
      // ומסעדות נזרקו בשקט, והסעה נשמרה כהשכרת רכב. נמדד ב-05.09.2026:
      // הודבק אישור מסעדה אמיתי, המודל החזיר אותו נכון, והמסך אמר
      // "נמצאו ויובאו: ." — רשימה ריקה שהוצגה כהצלחה.
      const toStore = toBookings(result, { sourceKind: 'paste' });

      // רשימה ריקה אינה הצלחה. isBooking אמר "כן" והמיפוי לא הניב דבר —
      // זה כשל, ולהציגו כהצלחה הוא בדיוק מה שקרה כאן קודם. הבדיקה קודמת
      // לשמירה: קודם נקרא addBookings על מערך ריק ורק אחר כך נבדק אם
      // יש מה לשמור, כלומר המאגר נכתב לשווא לפני הדיווח על הכשל.
      if (!toStore.length) {
        setNotice({ severity: 'error', text: t('emailImport.paste.emptyResult') });
        setIsLoading(false);
        return;
      }

      // שמירה למאגר ההזמנות. משם הן מקובצות אוטומטית לטיולים, כך
      // שאישורים שמגיעים בנפרד מתאחדים לנסיעה אחת.
      const { added, skipped } = await addBookings(toStore);

      // ── הטקסט נגזר ממה שקרה, לא ממה שציפינו שיקרה ──
      // הניסוח הקודם מנה שלושה סוגים מתוך שישה, ולכן ייבוא מוצלח של
      // אטרקציה או מסעדה הופיע כמשפט בלי נושא. התוויות היו גם ברבים
      // בלבד, והפיקו "1 טיסות"; כאן הן עוברות דרך צורות הריבוי של i18next.
      const parts = summarizeTypes(toStore);

      const dupNote = skipped > 0 ? ' ' + t('emailImport.success.merged', { n: skipped }) : '';

      // ההבטחה "בדוק את הפרטים לפני שמירה" הוסרה: addBookings שלמעלה
      // כבר שמר אותן. היא הציעה שלב שאינו קיים, ומשתמש שסמך עליה יצא
      // מהמסך בהנחה שדבר לא נשמר.
      //
      // added=0 פירושו שהכול היה כפילות — לא הצלחה חדשה ולא כשל. אותה
      // הבחנה שנעשתה במסלול הסריקה, כי הדבקה חוזרת של אותו מייל שכיחה.
      setNotice(added > 0
        ? { severity: 'success', text: t('emailImport.paste.success', { parts }) + dupNote }
        : { severity: 'info', text: t('emailImport.nothingNew', { matched: toStore.length }) + dupNote });
    } catch (err) {
      const msg = String(err?.message || '');
      // הטקסט הטכני יורד ל-detail ואינו נשפך לגוף ההודעה. המודל נשאר
      // פתוח והטקסט שהוקלד נשאר בשדה — הכשל אינו סיבה לאבד אותו.
      if (msg === 'PARSE_FAILED') {
        setNotice({ severity: 'error', text: t('emailImport.error.parseFailed') });
      } else if (isNetworkError(msg)) {
        setNotice({ severity: 'error', text: t('emailImport.error.network'), detail: msg });
      } else {
        setNotice({ severity: 'error', text: t('emailImport.error.extractFailed'), detail: msg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <>
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
        // ── גלילה פנימית, אחרת התוכן נחתך משני הצדדים ──
        // נמדד ב-375×667: לשונית Gmail היא 645px, כלומר 11px שוליים.
        // הקופסה ממורכזת ב-translate בלי maxHeight ובלי overflow, ולכן
        // כל התראה דחפה את הקצוות אל מחוץ למסך — בלי דרך לגלול אליהם.
        // דווקא במצב ההצלחה, שבו נפתחת גם רשימת המיילים שלא זוהו.
        maxHeight: '90vh',
        overflowY: 'auto',
        // ── הכיוון יורש מהמסמך ואינו נקבע כאן ──
        // `direction: 'rtl'` ו-`textAlign: 'right'` היו קשיחים, ולכן
        // המודל נשאר ימין-לשמאל גם בצרפתית ובאנגלית — הפיסוק קפץ לתחילת
        // המשפט והכפתורים ישבו בצד ההפוך. LanguageContext כבר כותב
        // `documentElement.dir` מהשפה הפעילה; זהו המקור היחיד.
        textAlign: 'start'
      }}>
        <Typography id="email-import-modal-title" variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          {t('travelInfoPage.import_title')}
        </Typography>
        
        {/* ── שלוש הלשוניות חייבות להיראות ב-375px ──
            נמדד 14.09.2026 בנייד: "ייבוא מקובץ" התחילה ב-‎-45px, כלומר חתוכה
            מחוץ לחלון — ובדיוק היא, המסלול היחיד שעובד לכל משתמש. `fullWidth`
            מחלק את הרוחב שווה, והתווית נשברת לשתי שורות במקום לגלוש. */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2, '& .MuiTab-root': { minWidth: 0, px: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.25 } }}
        >
          <Tab label={t('travelInfoPage.tab_paste')} />
          <Tab label={t('travelInfoPage.tab_gmail')} />
          <Tab label={t('travelInfoPage.tab_file')} />
        </Tabs>
        
        {/* חומרה אחת מתוך ארבע, נגזרת ממה שקרה. הטקסט הטכני יושב מתחת
            בגופן קטן: הוא נחוץ לדיווח תקלה, אבל בגוף ההודעה הוא הפך
            משפט מובן לשרשור של קוד שגיאה. */}
        {notice && (
          <Alert severity={notice.severity} onClose={clearNotice} sx={{ mb: 2 }}>
            {notice.text}
            {notice.detail && (
              <Typography
                component="span"
                variant="caption"
                sx={{ display: 'block', mt: 0.5, opacity: 0.7, wordBreak: 'break-word' }}
              >
                {t('emailImport.error.details')}: {notice.detail}
              </Typography>
            )}
          </Alert>
        )}

        {/* סריקת תיבה עשויה להימשך דקה — חיווי שקוף עדיף על ספינר אילם.
            הכותרת קבועה ומתורגמת; מתחתיה השלב הנוכחי כפי שהשירות מדווח. */}
        {scanProgress && (
          <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 2 }}>
            {t('emailImport.progress.working')}
            <Typography component="span" variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
              {scanProgress}
            </Typography>
          </Alert>
        )}

        {/* כשלא נמצאו הזמנות — מציגים מה כן נסרק, כדי שאפשר יהיה לכוונן
            את שאילתת החיפוש במקום לנחש */}
        {scannedSubjects.length > 0 && (
          <Box sx={{ mb: 2, maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
              {t('emailImport.unrecognized.heading', { n: scannedSubjects.length })}
            </Typography>
            {scannedSubjects.map((e, i) => (
              <Typography key={i} variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                • {e.subject || t('emailImport.unrecognized.noSubject')}
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
                // לוגי ולא פיזי: `ml` נשאר שמאלה גם כשהפריסה מתהפכת
                sx={{ marginInlineEnd: 2 }}
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
              // היה #f5f5f5 קשיח: במצב כהה הוא נשאר בהיר והטקסט שמעליו,
              // שכן מתחלף לפי הערכה, הפך אפור-בהיר על אפור-בהיר.
              bgcolor: 'action.hover',
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
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
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
              
              {/* הניסוח הקודם הבטיח "המידע לא נשמר בשרתים שלנו". זה נכון
                  לגוף המייל בלבד: פרטי ההזמנה שחולצו נשמרים — addBookings
                  כותב אותם לחשבון. ההבחנה חייבת להיאמר, שאם לא כן ההצהרה
                  שקרית בדיוק במקום שבו המשתמש סומך עליה. */}
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {t('emailImport.privacyNote')}
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
            
            {/* ── שני שערים לאותו מסלול ──
                בחירת קבצים (PDF, צילום מסך, EML) וצילום ישיר מהמצלמה. בטלפון
                `capture` פותח את המצלמה האחורית; במחשב הוא נפתח כבחירת קובץ,
                ולכן הכפתור מוצג רק כשיש מגע — שם הוא אומר מה שהוא עושה. */}
            <Box
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? 'primary.main' : 'divider',
                bgcolor: dragOver ? 'action.hover' : 'transparent',
                borderRadius: '8px',
                p: 4,
                textAlign: 'center',
                mb: 2,
                cursor: isLoading ? 'progress' : 'pointer',
                '&:hover': { borderColor: 'primary.main' },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
              // האזור נלחץ בעכבר בלבד: Box הוא div, ו-onClick לבדו אינו
              // נגיש למקלדת ואינו מוכרז כפקד. אותו שומר שהוחל על כרטיסי היעדים.
              role="button"
              tabIndex={0}
              aria-label={t('emailImport.uploadClick')}
              aria-disabled={isLoading}
              onClick={() => !isLoading && document.getElementById('fileUpload').click()}
              onKeyDown={(e) => {
                if (!isLoading && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  document.getElementById('fileUpload').click();
                }
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (!isLoading) importFiles(e.dataTransfer?.files);
              }}
            >
              <input
                type="file"
                id="fileUpload"
                style={{ display: 'none' }}
                accept=".pdf,application/pdf,image/*,.heic,.eml,.txt"
                multiple
                onChange={(e) => { const f = e.target.files; importFiles(f); e.target.value = ''; }}
              />
              <i className="material-icons" aria-hidden="true" style={{ fontSize: '48px', opacity: 0.4 }}>cloud_upload</i>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>
                {t('emailImport.uploadClick')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('emailImport.fileTypes')}
              </Typography>
            </Box>

            {hasTouch && (
              <>
                <input
                  type="file"
                  id="cameraUpload"
                  style={{ display: 'none' }}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => { const f = e.target.files; importFiles(f); e.target.value = ''; }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  onClick={() => document.getElementById('cameraUpload').click()}
                  startIcon={<i className="material-icons" aria-hidden="true">photo_camera</i>}
                  sx={{ mb: 2, minHeight: 44 }}
                >
                  {t('emailImport.upload.camera')}
                </Button>
              </>
            )}

            <Typography variant="caption" component="p" sx={{ color: 'text.secondary', mb: 2 }}>
              {t('emailImport.upload.privacy')}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={onClose}>
                {t('travelInfoPage.close')}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Modal>
    {gmailDisclosureDialog}
    </>
  );
};

export default EmailImportModal;