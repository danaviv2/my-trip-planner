/**
 * האם הרשומה מסכימה עם עצמה.
 *
 * ── סוג הבדיקה שחסר כאן מההתחלה ──
 * כל הבדיקות עד כה שאלו "האם השדה קיים": `isSubstantial`, `PURGEABLE`,
 * `withoutEmptyRecords`. אף אחת לא שאלה **האם השדות מסכימים זה עם זה**,
 * ולכן ערך שגוי שיושב בשדה מלא עבר את כולן.
 *
 * ── המקרה שגילה את זה ──
 * אל על שלחה שני מיילים על אותה טיסה, שניהם בנושא "צ'ק אין לטיסתך
 * הקרובה לנאפולי". אחד פוענח נכון — TLV ← NAP. השני, מתוך
 * BoardingPasses.pdf, פוענח הפוך: יוצא מנאפולי ונוחת בתל אביב.
 *
 * שלוש תוצאות נבעו מהערך ההפוך האחד הזה:
 *   1. שתי הרשומות סותרות זו את זו, ולכן **בצדק** לא אוחדו. במשך זמן רב
 *      זה נראה כתקלת כפילות, והחיפוש רץ במקום הלא נכון.
 *   2. הנסיעה נקראה "Tel Aviv Ben Gurion" — היעד נגזר משדה הנחיתה של
 *      טיסת ההלוך, ושדה זה אמר תל אביב.
 *   3. מסך התכנון קיבל עוגן שגוי.
 *
 * ── הכלל ──
 * סתירה פנימית אינה נמחקת ואינה מתוקנת בשקט. היא **מסומנת**: תיקון
 * אוטומטי של כיוון טיסה הוא ניחוש שנראה כמו ידיעה, וזה בדיוק מה שיצר
 * את הבעיה מלכתחילה.
 */

/** קוד IATA או שם שדה תעופה → מפתח להשוואה. */
const airportKey = (v) => {
  const s = String(v || '').trim().toUpperCase();
  if (!s) return '';
  if (/^[A-Z]{3}$/.test(s)) return s;
  // שם מלא: מזוהה לפי העיר שבתוכו
  const CITIES = [
    [/TEL AVIV|BEN ?GURION/, 'TLV'], [/NAPLES|NAPOLI|CAPODICHINO/, 'NAP'],
    [/ROME|ROMA|FIUMICINO/, 'FCO'], [/CIAMPINO/, 'CIA'],
    [/PARIS|CHARLES DE GAULLE/, 'CDG'], [/LONDON|HEATHROW/, 'LHR'],
    [/MILAN|MALPENSA/, 'MXP'], [/ATHENS/, 'ATH'], [/LARNACA/, 'LCA'],
    [/BARCELONA/, 'BCN'], [/MADRID/, 'MAD'], [/AMSTERDAM|SCHIPHOL/, 'AMS'],
    [/BANGKOK|SUVARNABHUMI/, 'BKK'], [/DUBAI/, 'DXB'], [/PRAGUE|PRAHA/, 'PRG'],
    [/VIENNA|WIEN/, 'VIE'], [/BUDAPEST/, 'BUD'], [/LISBON|LISBOA/, 'LIS'],
  ];
  const hit = CITIES.find(([re]) => re.test(s));
  return hit ? hit[1] : s.slice(0, 24);
};

/** עיר שמופיעה בנושא המייל → קוד שדה תעופה. בעברית ובאנגלית. */
const CITY_WORDS = [
  [/נאפולי|naples|napoli/i, 'NAP'],
  [/תל אביב|tel aviv/i, 'TLV'],
  [/רומא|rome\b/i, 'FCO'],
  [/פריז|paris/i, 'CDG'],
  [/לונדון|london/i, 'LHR'],
  [/ברצלונה|barcelona/i, 'BCN'],
  [/אמסטרדם|amsterdam/i, 'AMS'],
  [/מדריד|madrid/i, 'MAD'],
  [/אתונה|athens/i, 'ATH'],
  [/מילאנו|milan/i, 'MXP'],
  [/פראג|prague/i, 'PRG'],
  [/בודפשט|budapest/i, 'BUD'],
];

/**
 * היעד שהנושא מכריז עליו.
 *
 * הניסוח "לטיסתך הקרובה ל<עיר>" / "your flight to <city>" הוא הצהרה
 * מפורשת של השולח על יעד הטיסה — ולכן הוא בר-השוואה מול מה שפוענח.
 */
export const destinationFromSubject = (subject = '') => {
  const s = String(subject);
  const m = /(?:לטיסתך הקרובה ל|flight to)\s*([^/\n,|]+)/i.exec(s);
  if (!m) return '';
  const hit = CITY_WORDS.find(([re]) => re.test(m[1]));
  return hit ? hit[1] : '';
};

/**
 * סתירות פנימיות ברשומה אחת.
 *
 * @returns {string[]} תיאורים; מערך ריק = אין סתירה שנמצאה.
 */
export const contradictions = (b) => {
  if (!b) return [];
  const out = [];
  const type = b.type;

  if (type === 'flight') {
    const dep = airportKey(b.departureAirport);
    const arr = airportKey(b.arrivalAirport);

    if (dep && arr && dep === arr) {
      out.push(`טיסה יוצאת ונוחתת באותו שדה (${dep})`);
    }

    // ההצהרה בנושא מול מה שפוענח. זו הבדיקה שתופסת כיוון הפוך.
    const declared = destinationFromSubject(b.sourceSubject);
    if (declared && arr && declared !== arr) {
      out.push(
        `הנושא מכריז על טיסה ל-${declared}, אך הרשומה נוחתת ב-${arr}`
        + (dep === declared ? ` ויוצאת מ-${dep} — הכיוון נראה הפוך` : '')
      );
    }
  }

  if (type === 'hotel' && b.checkIn && b.checkOut && b.checkOut < b.checkIn) {
    out.push(`יציאה (${b.checkOut}) לפני כניסה (${b.checkIn})`);
  }

  if ((type === 'car_rental' || type === 'transfer')
      && b.pickupDate && b.returnDate && b.returnDate < b.pickupDate) {
    out.push(`החזרה (${b.returnDate}) לפני איסוף (${b.pickupDate})`);
  }

  if (type === 'insurance' && b.startDate && b.endDate && b.endDate < b.startDate) {
    out.push(`תוקף מסתיים (${b.endDate}) לפני שהתחיל (${b.startDate})`);
  }

  return out;
};

/**
 * סתירה בין רשומות: שתי טיסות באותו יום בכיוונים הפוכים.
 *
 * זהו הצד השני של אותו מטבע. כשהן קיימות, אחת מהן שגויה — והצגת שתיהן
 * כאילו שתיהן נכונות היא בדיוק מה שקרה כאן.
 */
export const crossContradictions = (bookings = []) => {
  const flights = bookings.filter((b) => b && b.type === 'flight' && b.date);
  const out = [];

  flights.forEach((a, i) => {
    flights.slice(i + 1).forEach((c) => {
      if (a.date !== c.date) return;
      const aDep = airportKey(a.departureAirport);
      const aArr = airportKey(a.arrivalAirport);
      const cDep = airportKey(c.departureAirport);
      const cArr = airportKey(c.arrivalAirport);
      if (!aDep || !aArr || !cDep || !cArr) return;
      if (aDep === cArr && aArr === cDep) {
        out.push(`${a.date}: שתי טיסות בכיוונים הפוכים — ${aDep}→${aArr} מול ${cDep}→${cArr}. אחת מהן פוענחה הפוך.`);
      }
    });
  });

  return out;
};


/**
 * מנקה שדה שסותר את ההצהרה של המקור.
 *
 * ── למה ניקוי ולא היפוך ──
 * הפיתוי הוא להחליף בין השדות: הנושא אומר נאפולי, הרשומה אומרת ההפך,
 * אז להפוך. אבל היפוך הוא ניחוש שנראה כמו ידיעה — בדיוק סוג הערך שיצר
 * את התקלה מלכתחילה. שדה ריק מתוקן על ידי המסמך הבא; שדה הפוך נשאר
 * ומוליך שולל.
 *
 * ── ומה קורה אחרי הניקוי ──
 * הרשומה מפסיקה לסתור את התאום שלה, ולכן שתיהן מתאחדות: זו שנשארה עם
 * שדות התעופה הנכונים מספקת אותם, וזו שנשארה עם מספר הטיסה מספקת אותו.
 * הערך הנכון מנצח בלי שאיש ניחש אותו.
 */
export const withoutContradictedFields = (b) => {
  if (!b || b.type !== 'flight') return b;

  const declared = destinationFromSubject(b.sourceSubject);
  if (!declared) return b;

  const dep = airportKey(b.departureAirport);
  const arr = airportKey(b.arrivalAirport);
  if (!dep || !arr) return b;

  // הכיוון הפוך בדיוק: יוצא מהיעד המוצהר ונוחת במקום אחר.
  if (dep === declared && arr !== declared) {
    return {
      ...b,
      departureAirport: '',
      arrivalAirport: '',
      contradiction: `כיוון הפוך לנושא ("${declared}") — שדות התעופה נוקו`,
    };
  }

  return b;
};

export default { contradictions, crossContradictions, destinationFromSubject, withoutContradictedFields };
