import { COUNTRY_RULES, ZTL_CITIES, CAR_FREE } from './drivingRestrictionsData';

/**
 * מגבלות נהיגה שתיירים נקנסים עליהן בלי לדעת.
 *
 * הקנס על כניסה לאזור מוגבל הוא כ-100 אירו לכל כניסה, נאכף במצלמה ללא
 * כל סימן מיידי, ומגיע חודשים אחרי החזרה — לרוב דרך חברת ההשכרה בתוספת
 * דמי טיפול. אין שלט שאומר "עצור", יש מצלמה.
 *
 * אפליקציית ניווט מתריעה כשמגיעים לשער, וזה מאוחר: המלון כבר נבחר והרכב
 * כבר נשכר. אזהרה בזמן התכנון מאפשרת לבקש היתר, לבחור חניון, או לוותר
 * על הרכב מלכתחילה. וקטגוריה שלמה — מדבקות ורישום מוקדם — אינה ניתנת
 * להצלה בזמן נסיעה כלל, שכן ההסדרה חייבת לקרות שבועות מראש.
 *
 * הנתונים עצמם ב-drivingRestrictionsData, יחד עם ההסבר מדוע רשימה
 * מתוחזקת ולא שירות חיצוני או מודל שפה.
 */

/**
 * כלל "לוחית מתחלפת" בכביש חוף אמלפי (SS163).
 * בחודשי הקיץ מתחלפים ימי זוגי ואי-זוגי לפי הספרה האחרונה בלוחית.
 */
const isSummer = (date) => {
  const m = date.getMonth() + 1;
  return m >= 6 && m <= 9;
};

const parse = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * @param {Array} bookings הזמנות הנסיעה
 * @param {string} [plannedDestination] יעד שהוקלד במתכנן, גם ללא הזמנות
 * @returns {Array<{severity,title,detail}>}
 */
export const findDrivingRestrictions = (bookings = [], plannedDestination = '') => {
  // הסעה עם נהג מקומי אינה מקימה אזהרה: האחריות לקנס אינה על הנוסע.
  const rentals = bookings.filter((b) => b.type === 'car_rental');
  const issues = [];

  // כל טקסט שמעיד היכן הנסיעה מתרחשת
  const places = [
    plannedDestination,
    ...bookings.flatMap((b) => [
      b.pickupLocation, b.returnLocation, b.address,
      b.name, b.arrivalAirport, b.departureAirport, b.destination,
    ]),
  ]
    .filter(Boolean)
    .join(' | ');

  if (!places.trim()) return issues;

  // ── מקומות ללא רכב — רלוונטי גם בלי השכרה ──
  CAR_FREE.forEach(({ test, place, detail }) => {
    if (test.test(places)) {
      issues.push({ severity: 'info', title: `${place} — ללא כלי רכב`, detail });
    }
  });

  // בשלב התכנון עוד אין הזמנת רכב, ודווקא אז האזהרה שווה ביותר: אפשר
  // עוד להחליט שלא לשכור. לכן ללא רכב מוצגות המגבלות כמידע מקדים, ורק
  // כשקיימת השכרה בפועל הן מוצגות כאזהרה.
  const planningOnly = !rentals.length;
  if (planningOnly && !plannedDestination) return issues;

  // ── מגבלות מדינה ──
  // המחייבות הסדרה מראש מוצגות ראשונות: הן היחידות שאי אפשר לתקן בדרך.
  COUNTRY_RULES.filter(({ test }) => test.test(places))
    .sort((a, b) => Number(b.advanceAction) - Number(a.advanceAction))
    .forEach(({ advanceAction, title, detail }) => {
      if (planningOnly) {
        issues.push({
          severity: 'info',
          title: `אם תשכור רכב — ${title}`,
          detail,
        });
        return;
      }
      issues.push({
        severity: advanceAction ? 'warning' : 'info',
        title: advanceAction ? `לפני הנסיעה — ${title}` : title,
        detail: advanceAction
          ? `${detail} כדאי להסדיר זאת עכשיו ולא בדרך.`
          : detail,
      });
    });

  // ── אזורים עירוניים ──
  const hits = ZTL_CITIES.filter(({ test }) => test.test(places));
  if (hits.length) {
    issues.push({
      severity: planningOnly ? 'info' : 'warning',
      title: `${planningOnly ? 'לתשומת לבך — ' : ''}אזורי תנועה מוגבלת — ${hits.map((h) => h.city).join(', ')}`,
      detail:
        'כניסה נאכפת במצלמה, והקנס (כ-100 אירו לכניסה) מגיע חודשים לאחר ' +
        'החזרה דרך חברת ההשכרה בתוספת דמי טיפול. ' +
        hits.map((h) => `${h.city}: ${h.detail}`).join(' ') +
        ' אם המלון נמצא בתוך האזור — בקש ממנו מראש לרשום את מספר הרכב, זהו ' +
        'ההיתר היחיד שמונע את הקנס. הפרטים משתנים לפי עונה, ולכן כדאי לוודא מקומית.',
    });
  }

  // ── לוחית מתחלפת בחוף אמלפי ──
  const onAmalfi =
    /amalfi|positano|sorrento|praiano|ravello|amalfitana|sant'?\s?agata|massa\s?lubrense|אמלפי|פוזיטאנו|סורנטו|סנט\s?אגאת/i.test(places);
  if (onAmalfi) {
    const inSeason = rentals.some((r) => {
      const a = parse(r.pickupDate);
      const b = parse(r.returnDate) || a;
      return (a && isSummer(a)) || (b && isSummer(b));
    });
    if (inSeason) {
      issues.push({
        severity: 'warning',
        title: 'חוף אמלפי — הגבלת לוחית זוגית/אי-זוגית',
        detail:
          'בחודשי הקיץ נוהג בכביש החוף (SS163) הסדר "targa alterna": בימים ' +
          'מסוימים מותרת תנועה ללוחיות המסתיימות בספרה זוגית בלבד, ובאחרים ' +
          'לאי-זוגית. ההסדר משתנה משנה לשנה — בדוק את מספר הרכב מול הכללים ' +
          'העדכניים, ושקול אוטובוס SITA או מעבורת ביום חסום.',
      });
    }
  }

  return issues;
};

/** כמה אזורים ומדינות מכוסים — לתצוגה כשמסבירים את גבולות הכיסוי. */
export const coverageSize = () => COUNTRY_RULES.length + ZTL_CITIES.length + CAR_FREE.length;
