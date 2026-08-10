/**
 * שדות תעופה — קואורדינטות ושיוך משפטי.
 *
 * המרחק בין המוצא ליעד קובע את גובה הפיצוי בשני החוקים, והשיוך המדינתי
 * קובע איזה חוק בכלל חל. שניהם נגזרים מקוד ה-IATA שכבר נקלט מאישור
 * ההזמנה, ולכן אין צורך בשירות חיצוני.
 *
 * `eu261` מסמן שדה שההמראה ממנו מקימה זכאות לפי תקנת האיחוד האירופי —
 * כולל נורבגיה, איסלנד ושווייץ, שאינן חברות באיחוד אך התקנה חלה בהן.
 * בריטניה יצאה מהתקנה ומפעילה גרסה משלה, ולכן מסומנת בנפרד.
 *
 * הרשימה מכסה את היעדים הנפוצים מישראל. שדה שאינו כאן אינו מוביל
 * לניחוש: המערכת תאמר שאין בידה מרחק, ולא תמציא סכום.
 */

export const AIRPORTS = {
  // ── ישראל ──
  TLV: { city: 'תל אביב', country: 'IL', lat: 32.0114, lng: 34.8867 },
  ETH: { city: 'אילת', country: 'IL', lat: 29.7233, lng: 35.0033 },
  VDA: { city: 'עובדה', country: 'IL', lat: 29.9403, lng: 34.9358 },
  HFA: { city: 'חיפה', country: 'IL', lat: 32.8094, lng: 35.0431 },

  // ── איטליה ──
  NAP: { city: 'נאפולי', country: 'IT', lat: 40.8860, lng: 14.2908, eu261: true },
  FCO: { city: 'רומא פיומיצ׳ינו', country: 'IT', lat: 41.8003, lng: 12.2389, eu261: true },
  CIA: { city: 'רומא צ׳אמפינו', country: 'IT', lat: 41.7994, lng: 12.5949, eu261: true },
  MXP: { city: 'מילאנו מלפנסה', country: 'IT', lat: 45.6306, lng: 8.7281, eu261: true },
  BGY: { city: 'ברגמו', country: 'IT', lat: 45.6739, lng: 9.7042, eu261: true },
  LIN: { city: 'מילאנו לינאטה', country: 'IT', lat: 45.4451, lng: 9.2767, eu261: true },
  VCE: { city: 'ונציה', country: 'IT', lat: 45.5053, lng: 12.3519, eu261: true },
  FLR: { city: 'פירנצה', country: 'IT', lat: 43.8100, lng: 11.2051, eu261: true },
  PSA: { city: 'פיזה', country: 'IT', lat: 43.6839, lng: 10.3927, eu261: true },
  BLQ: { city: 'בולוניה', country: 'IT', lat: 44.5354, lng: 11.2887, eu261: true },
  CTA: { city: 'קטניה', country: 'IT', lat: 37.4668, lng: 15.0664, eu261: true },
  BRI: { city: 'בארי', country: 'IT', lat: 41.1389, lng: 16.7606, eu261: true },

  // ── יוון וקפריסין ──
  ATH: { city: 'אתונה', country: 'GR', lat: 37.9364, lng: 23.9445, eu261: true },
  SKG: { city: 'סלוניקי', country: 'GR', lat: 40.5197, lng: 22.9709, eu261: true },
  HER: { city: 'הרקליון', country: 'GR', lat: 35.3397, lng: 25.1803, eu261: true },
  RHO: { city: 'רודוס', country: 'GR', lat: 36.4054, lng: 28.0862, eu261: true },
  JTR: { city: 'סנטוריני', country: 'GR', lat: 36.3992, lng: 25.4793, eu261: true },
  LCA: { city: 'לרנקה', country: 'CY', lat: 34.8751, lng: 33.6249, eu261: true },
  PFO: { city: 'פאפוס', country: 'CY', lat: 34.7180, lng: 32.4857, eu261: true },

  // ── צרפת, ספרד, פורטוגל ──
  CDG: { city: 'פריז שארל דה גול', country: 'FR', lat: 49.0097, lng: 2.5479, eu261: true },
  ORY: { city: 'פריז אורלי', country: 'FR', lat: 48.7233, lng: 2.3794, eu261: true },
  NCE: { city: 'ניס', country: 'FR', lat: 43.6584, lng: 7.2159, eu261: true },
  LYS: { city: 'ליון', country: 'FR', lat: 45.7256, lng: 5.0811, eu261: true },
  MRS: { city: 'מרסיי', country: 'FR', lat: 43.4393, lng: 5.2214, eu261: true },
  BCN: { city: 'ברצלונה', country: 'ES', lat: 41.2974, lng: 2.0833, eu261: true },
  MAD: { city: 'מדריד', country: 'ES', lat: 40.4936, lng: -3.5668, eu261: true },
  AGP: { city: 'מלגה', country: 'ES', lat: 36.6749, lng: -4.4991, eu261: true },
  PMI: { city: 'פלמה', country: 'ES', lat: 39.5517, lng: 2.7388, eu261: true },
  LIS: { city: 'ליסבון', country: 'PT', lat: 38.7742, lng: -9.1342, eu261: true },
  OPO: { city: 'פורטו', country: 'PT', lat: 41.2481, lng: -8.6814, eu261: true },

  // ── מרכז ומערב אירופה ──
  FRA: { city: 'פרנקפורט', country: 'DE', lat: 50.0379, lng: 8.5622, eu261: true },
  MUC: { city: 'מינכן', country: 'DE', lat: 48.3538, lng: 11.7861, eu261: true },
  BER: { city: 'ברלין', country: 'DE', lat: 52.3667, lng: 13.5033, eu261: true },
  DUS: { city: 'דיסלדורף', country: 'DE', lat: 51.2895, lng: 6.7668, eu261: true },
  AMS: { city: 'אמסטרדם', country: 'NL', lat: 52.3105, lng: 4.7683, eu261: true },
  BRU: { city: 'בריסל', country: 'BE', lat: 50.9014, lng: 4.4844, eu261: true },
  VIE: { city: 'וינה', country: 'AT', lat: 48.1103, lng: 16.5697, eu261: true },
  ZRH: { city: 'ציריך', country: 'CH', lat: 47.4647, lng: 8.5492, eu261: true },
  GVA: { city: 'ז׳נבה', country: 'CH', lat: 46.2381, lng: 6.1089, eu261: true },
  PRG: { city: 'פראג', country: 'CZ', lat: 50.1008, lng: 14.2600, eu261: true },
  BUD: { city: 'בודפשט', country: 'HU', lat: 47.4369, lng: 19.2556, eu261: true },
  WAW: { city: 'ורשה', country: 'PL', lat: 52.1657, lng: 20.9671, eu261: true },
  KRK: { city: 'קרקוב', country: 'PL', lat: 50.0777, lng: 19.7848, eu261: true },
  CPH: { city: 'קופנהגן', country: 'DK', lat: 55.6180, lng: 12.6560, eu261: true },
  ARN: { city: 'שטוקהולם', country: 'SE', lat: 59.6519, lng: 17.9186, eu261: true },
  OSL: { city: 'אוסלו', country: 'NO', lat: 60.1976, lng: 11.1004, eu261: true },
  KEF: { city: 'רייקיאוויק', country: 'IS', lat: 63.9850, lng: -22.6056, eu261: true },
  DUB: { city: 'דבלין', country: 'IE', lat: 53.4213, lng: -6.2701, eu261: true },
  SOF: { city: 'סופיה', country: 'BG', lat: 42.6967, lng: 23.4114, eu261: true },
  OTP: { city: 'בוקרשט', country: 'RO', lat: 44.5711, lng: 26.0850, eu261: true },
  ZAG: { city: 'זאגרב', country: 'HR', lat: 45.7429, lng: 16.0688, eu261: true },
  SPU: { city: 'ספליט', country: 'HR', lat: 43.5389, lng: 16.2980, eu261: true },
  TIA: { city: 'טירנה', country: 'AL', lat: 41.4147, lng: 19.7206 },

  // ── בריטניה: תקנה נפרדת ──
  LHR: { city: 'לונדון הית׳רו', country: 'GB', lat: 51.4700, lng: -0.4543, uk261: true },
  LGW: { city: 'לונדון גטוויק', country: 'GB', lat: 51.1537, lng: -0.1821, uk261: true },
  LTN: { city: 'לונדון לוטון', country: 'GB', lat: 51.8747, lng: -0.3683, uk261: true },
  STN: { city: 'לונדון סטנסטד', country: 'GB', lat: 51.8860, lng: 0.2389, uk261: true },
  MAN: { city: 'מנצ׳סטר', country: 'GB', lat: 53.3650, lng: -2.2728, uk261: true },

  // ── יעדים נפוצים נוספים ──
  IST: { city: 'איסטנבול', country: 'TR', lat: 41.2753, lng: 28.7519 },
  AYT: { city: 'אנטליה', country: 'TR', lat: 36.8987, lng: 30.8005 },
  DXB: { city: 'דובאי', country: 'AE', lat: 25.2532, lng: 55.3657 },
  AUH: { city: 'אבו דאבי', country: 'AE', lat: 24.4330, lng: 54.6511 },
  JFK: { city: 'ניו יורק JFK', country: 'US', lat: 40.6413, lng: -73.7781 },
  EWR: { city: 'ניוארק', country: 'US', lat: 40.6895, lng: -74.1745 },
  LAX: { city: 'לוס אנג׳לס', country: 'US', lat: 33.9416, lng: -118.4085 },
  MIA: { city: 'מיאמי', country: 'US', lat: 25.7959, lng: -80.2870 },
  YYZ: { city: 'טורונטו', country: 'CA', lat: 43.6777, lng: -79.6248 },
  BKK: { city: 'בנגקוק', country: 'TH', lat: 13.6900, lng: 100.7501 },
  NRT: { city: 'טוקיו נאריטה', country: 'JP', lat: 35.7720, lng: 140.3929 },
  DEL: { city: 'דלהי', country: 'IN', lat: 28.5562, lng: 77.1000 },
  SEZ: { city: 'סיישל', country: 'SC', lat: -4.6743, lng: 55.5218 },
  CPT: { city: 'קייפטאון', country: 'ZA', lat: -33.9715, lng: 18.6021 },
  TBS: { city: 'טביליסי', country: 'GE', lat: 41.6692, lng: 44.9547 },
  EVN: { city: 'ירוואן', country: 'AM', lat: 40.1473, lng: 44.3959 },
  BAK: { city: 'באקו', country: 'AZ', lat: 40.4675, lng: 50.0467 },
};

/**
 * מאתר שדה תעופה לפי קוד או שם.
 *
 * הפענוח מחזיר לעיתים שם מלא ("ROME FIUMICINO") ולעיתים קוד ("FCO"),
 * ולכן שתי הצורות נתמכות.
 */
export const findAirport = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return null;

  const code = text.toUpperCase();
  if (AIRPORTS[code]) return { code, ...AIRPORTS[code] };

  // התאמה לפי קוד שמופיע בתוך מחרוזת ארוכה, למשל "... (NAP), Viale ..."
  const inParens = code.match(/\(([A-Z]{3})\)/);
  if (inParens && AIRPORTS[inParens[1]]) return { code: inParens[1], ...AIRPORTS[inParens[1]] };

  // התאמה לפי שם עיר, באנגלית או בעברית
  const lower = text.toLowerCase();
  const NAMES = {
    naples: 'NAP', napoli: 'NAP', נאפולי: 'NAP',
    rome: 'FCO', roma: 'FCO', fiumicino: 'FCO', רומא: 'FCO',
    'tel aviv': 'TLV', 'ben gurion': 'TLV', 'תל אביב': 'TLV',
    paris: 'CDG', פריז: 'CDG',
    london: 'LHR', לונדון: 'LHR',
    milan: 'MXP', milano: 'MXP', מילאנו: 'MXP',
    athens: 'ATH', אתונה: 'ATH',
    barcelona: 'BCN', ברצלונה: 'BCN',
    venice: 'VCE', venezia: 'VCE', ונציה: 'VCE',
  };
  const hit = Object.keys(NAMES).find((k) => lower.includes(k));
  return hit ? { code: NAMES[hit], ...AIRPORTS[NAMES[hit]] } : null;
};
