/**
 * מגבלות נהיגה שתיירים נקנסים עליהן בלי לדעת.
 *
 * הקנס על כניסה ל-ZTL באיטליה הוא כ-100 אירו לכל כניסה, והוא מגיע חודשים
 * אחרי החזרה — לרוב דרך חברת ההשכרה, בתוספת דמי טיפול. אין שלט שאומר
 * "עצור", יש מצלמה. תייר אוסף שלושה־ארבעה קנסות בלי לחשוד בדבר.
 *
 * האזהרה הזו שווה כסף רק אם היא מגיעה לפני הנסיעה, ולכן היא נגזרת
 * מההזמנות עצמן: רכב שכור בתאריכים מסוימים, ולינה בעיר מסוימת.
 *
 * הנתונים כאן הם כללי אצבע. שעות ה-ZTL משתנות לפי עונה, לפי יום בשבוע
 * ולפי החלטות עירוניות, ולכן כל אזהרה מפנה לאימות מקומי ואינה מתיימרת
 * להיות מדויקת לשעה.
 */

/** ערים שבהן מרכז היסטורי סגור לתנועה, עם אכיפה במצלמות. */
const ZTL_CITIES = [
  {
    test: /napoli|naples|נאפולי/i,
    city: 'נאפולי',
    detail:
      'למרכז ההיסטורי יש ZTL פעיל, והחניה בעיר קשה גם מחוץ לו. רוב המבקרים ' +
      'משאירים את הרכב בחניון מחוץ למרכז ונעים ברגל ובמטרו.',
  },
  {
    test: /roma\b|rome|רומא/i,
    city: 'רומא',
    detail:
      'ה-ZTL של Centro Storico מכסה כמעט את כל אזור האתרים. גם טרסטוורה ' +
      'ומונטי מוגבלים בשעות הערב.',
  },
  {
    test: /firenze|florence|פירנצה/i,
    city: 'פירנצה',
    detail:
      'אחד ה-ZTL המחמירים באיטליה, ועם מצלמות רבות. גם נסיעה קצרה למלון ' +
      'שבתוך האזור נספרת ככניסה.',
  },
  {
    test: /milano|milan|מילאנו/i,
    city: 'מילאנו',
    detail: 'Area C היא גם אזור מוגבל וגם אזור בתשלום, ונאכפת במצלמות.',
  },
  { test: /bologna|בולוניה/i, city: 'בולוניה', detail: 'ZTL נרחב במרכז ההיסטורי.' },
  { test: /pisa|פיזה/i, city: 'פיזה', detail: 'ZTL סביב אזור המגדל והדואומו.' },
  { test: /siena|סיינה/i, city: 'סיינה', detail: 'המרכז סגור כמעט לחלוטין לרכב שאינו מקומי.' },
  { test: /verona|ורונה/i, city: 'ורונה', detail: 'ZTL במרכז ההיסטורי סביב הארנה.' },
  { test: /torino|turin|טורינו/i, city: 'טורינו', detail: 'ZTL מרכזי בשעות היום.' },
  { test: /sorrento|סורנטו/i, city: 'סורנטו', detail: 'ZTL עונתי במרכז, פעיל במיוחד בחודשי הקיץ.' },
  {
    // חצי האי סורנטו נכלל כאן ולא רק אמלפי עצמה: לינה בסנט אגאתה או
    // במאסה לוברנסה כמעט תמיד כרוכה בנסיעה על כביש החוף.
    test: /amalfi|positano|praiano|ravello|amalfitana|sant'?\s?agata|massa\s?lubrense|אמלפי|פוזיטאנו|סנט\s?אגאת/i,
    city: 'חוף אמלפי וחצי האי סורנטו',
    detail: 'מגבלות תנועה וחניה בכפרים לאורך הכביש, והכביש עצמו צר ועמוס בעונה.',
  },
];

/** מקומות שבהם רכב אינו רלוונטי כלל. */
const CAR_FREE = [
  { test: /venezia|venice|ונציה/i, place: 'ונציה', detail: 'העיר כולה ללא כלי רכב. הרכב נשאר בחניון בפיאצאלה רומא או במסטרה, בתשלום יומי.' },
  { test: /capri|קאפרי/i, place: 'קאפרי', detail: 'האי סגור לרכב של מבקרים בעונה.' },
  { test: /\bhydra\b|ידרה/i, place: 'הידרה', detail: 'האי כולו ללא כלי רכב.' },
];

/**
 * כלל "לוחית מתחלפת" בכביש חוף אמלפי (SS163).
 * בחודשי הקיץ מתחלפים ימי זוגי ואי-זוגי לפי הספרה האחרונה בלוחית.
 */
const isAmalfiSeason = (date) => {
  const m = date.getMonth() + 1; // 1–12
  return m >= 6 && m <= 9;
};

const parse = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * @param {Array} bookings הזמנות הנסיעה
 * @returns {Array<{severity,title,detail}>}
 */
export const findDrivingRestrictions = (bookings = []) => {
  // הסעה אינה רלוונטית: הנהג המקומי מכיר את האזור ואחראי לקנסות שלו.
  const rentals = bookings.filter((b) => b.type === 'car_rental');
  const issues = [];

  // כל טקסט שמעיד היכן הנסיעה מתרחשת
  const places = bookings
    .flatMap((b) => [b.pickupLocation, b.returnLocation, b.address, b.name, b.arrivalAirport, b.departureAirport])
    .filter(Boolean)
    .join(' | ');

  // ── מקומות ללא רכב — רלוונטי גם בלי השכרה ──
  CAR_FREE.forEach(({ test, place, detail }) => {
    if (test.test(places)) {
      issues.push({
        severity: 'info',
        title: `${place} — ללא כלי רכב`,
        detail,
      });
    }
  });

  if (!rentals.length) return issues;

  // ── ZTL ──
  const hits = ZTL_CITIES.filter(({ test }) => test.test(places));
  if (hits.length) {
    const names = hits.map((h) => h.city).join(', ');
    issues.push({
      severity: 'warning',
      title: `אזורי ZTL במסלול — ${names}`,
      detail:
        `כניסה לאזור מוגבל נאכפת במצלמה, והקנס (כ-100 אירו לכניסה) מגיע חודשים ` +
        `לאחר החזרה דרך חברת ההשכרה בתוספת דמי טיפול. ` +
        hits.map((h) => `${h.city}: ${h.detail}`).join(' ') +
        ` אם המלון נמצא בתוך האזור — בקש ממנו מראש לרשום את מספר הרכב, זהו ` +
        `ההיתר היחיד שמונע את הקנס. השעות משתנות לפי עונה, ולכן כדאי לוודא מקומית.`,
    });
  }

  // ── לוחית מתחלפת בחוף אמלפי ──
  const onAmalfi =
    /amalfi|positano|sorrento|praiano|ravello|amalfitana|sant'?\s?agata|massa\s?lubrense|אמלפי|פוזיטאנו|סורנטו|סנט\s?אגאת/i.test(places);
  if (onAmalfi) {
    const inSeason = rentals.some((r) => {
      const a = parse(r.pickupDate);
      const b = parse(r.returnDate) || a;
      return (a && isAmalfiSeason(a)) || (b && isAmalfiSeason(b));
    });
    if (inSeason) {
      issues.push({
        severity: 'warning',
        title: 'חוף אמלפי — הגבלת לוחית זוגית/אי-זוגית',
        detail:
          'בחודשי הקיץ נוהג בכביש החוף (SS163) הסדר "targa alterna": בימים ' +
          'מסוימים מותרת תנועה ללוחיות המסתיימות בספרה זוגית בלבד, ובאחרים ' +
          'לאי-זוגית. ההסדר משתנה משנה לשנה — בדוק את מספר הרכב מול הכללים ' +
          'העדכניים לפני שאתה יוצא לדרך, ושקול אוטובוס SITA או מעבורת ביום חסום.',
      });
    }
  }

  return issues;
};
