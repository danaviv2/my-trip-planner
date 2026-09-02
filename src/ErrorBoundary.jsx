import React, { Component } from 'react';

/**
 * גבול השגיאות העליון של האפליקציה.
 *
 * הטקסט כאן קשיח בעברית ולא עובר i18n בכוונה: הרכיב עוטף את
 * `LanguageProvider` עצמו, ולכן אסור לו להיות תלוי בו — ספק שנפל הוא
 * בדיוק המקרה שבו הגבול הזה נדרש.
 */

/**
 * כשל בטעינת צ'אנק אינו שגיאה רגילה, והוא הנפוץ ביותר כאן.
 *
 * כל דף באפליקציה הוא `React.lazy`. אחרי פריסה ל-Vercel, מי שהשאיר
 * טאב פתוח מבקש צ'אנק בשם ישן שכבר אינו קיים בשרת — וכל המסך מת.
 * זה קרה גם בפיתוח, כששרת הפיתוח נעצר.
 *
 * שני נוסחים נבדקים משום שהדפדפנים אינם מסכימים ביניהם: כרום זורק
 * `ChunkLoadError` עם שם, ואחרים משאירים את ההודעה בלבד.
 */
const isChunkError = (error) =>
  error?.name === 'ChunkLoadError' ||
  /loading chunk .* failed/i.test(error?.message || '') ||
  /loading css chunk .* failed/i.test(error?.message || '');

// חלון הגנה מלולאה. רענון שאינו פותר את הבעיה היה טוען מחדש בלי סוף,
// וזה גרוע ממסך שגיאה: המשתמש אינו יכול אפילו לקרוא מה קרה.
const RELOAD_KEY = 'chunkReloadAt';
const RELOAD_GUARD_MS = 30000;

const reloadedRecently = () => {
  try {
    const ts = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    return ts > 0 && Date.now() - ts < RELOAD_GUARD_MS;
  } catch {
    // דפדפן שחוסם אחסון — עדיף לוותר על הרענון האוטומטי מאשר להסתכן בלולאה
    return true;
  }
};

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by Error Boundary:', error, errorInfo);

    // רינדור חוזר אינו יכול לרפא צ'אנק חסר — הוא יבקש בדיוק את אותו
    // קובץ ויכשל שוב. רק טעינה מחדש מביאה `index.html` עם השמות החדשים.
    if (isChunkError(error) && !reloadedRecently()) {
      try {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch {
        // ignore storage errors
      }
      window.location.reload();
    }
  }

  handleRetry = () => {
    if (isChunkError(this.state.error)) {
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        // ignore storage errors
      }
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const chunk = isChunkError(this.state.error);

    return (
      <div style={{ direction: 'rtl', textAlign: 'center', padding: '48px 24px', fontFamily: 'inherit' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>
          {chunk ? 'עלתה גרסה חדשה של האפליקציה' : 'אירעה שגיאה'}
        </h1>
        <p style={{ color: '#555', marginBottom: 20 }}>
          {chunk
            ? 'הדף שהיה פתוח שייך לגרסה קודמת. טעינה מחדש תביא את החדשה.'
            /* הודעת המערכת מוצגת רק כשהיא אינה מונח פנימי: "Loading chunk
               ... failed" אינו אומר למשתמש דבר, ורק נראה כמו תקלה חמורה. */
            : this.state.error?.message}
        </p>
        <button
          onClick={this.handleRetry}
          style={{ padding: '8px 20px', fontSize: 15, borderRadius: 8, cursor: 'pointer' }}
        >
          {chunk ? 'טען מחדש' : 'נסה שוב'}
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
