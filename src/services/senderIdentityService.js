/**
 * מי שלח את המסמך, ומה זה מוכיח.
 *
 * ── למה זה קיים ──
 * שובר כניסה לטרקלין נכנס למאגר כאטרקציה, ובנה נסיעה בשם "יעד לא ידוע".
 * פוליסה שפגה בנובמבר 2025 נספרה תחת "הנסיעות שלך". התחקיר על מבנה
 * מספרי האסמכתה העלה שהצורה אינה יכולה להפריד ביניהם: אצל המשתמש
 * שובר הטרקלין נשא 8100075717619000 והזמנת מלון אמיתית נשאה
 * 2025122845091373 — שש-עשרה ספרות רצופות, שתיהן.
 *
 * מה שכן מפריד הוא מי שלח. הכתובת נשלפת ממילא בזמן הסריקה
 * (`gmailService`), ונזרקה צעד לפני הפענוח — בדיוק כפי שקרה ל-messageId.
 *
 * ── מה הטבלה הזו אינה ──
 * היא אינה מכריעה לבדה. ספק אחד שולח כמה סוגי מסמכים: PassportCard שולח
 * גם פוליסה וגם שובר טרקלין, וסוכנות נסיעות שולחת הכל. לכן לכל רשומה יש
 * `sole` — האם הדומיין מספיק כהכרעה, או רק מצמצם. ספק רב-מוצרי מסומן
 * `sole: false`, וההכרעה נשארת אצל מי שקורא את המסמך.
 *
 * ── ולמה `benefit` אינו סוג הזמנה ──
 * זכאות אינה הזמנה. לטרקלין יש תוקף, אין לו מועד, מקום או טווח. ספק
 * שכל תוצרתו זכאויות מסומן כך, וזו הקביעה היחידה בטבלה שמותר לה לפסול
 * מסמך על הסף.
 */

/**
 * @typedef {'flight'|'hotel'|'car_rental'|'activity'|'insurance'|'benefit'|'mixed'} SenderKind
 */

/**
 * דומיין → מה הוא מוכיח.
 * `sole: true` — הספק מוכר מוצר אחד, ולכן הדומיין מכריע.
 * `sole: false` — הספק מוכר כמה סוגים; הדומיין מצמצם ולא פוסק.
 */
const DOMAINS = {
  // ── חברות תעופה ──
  'elal.co.il': { kind: 'flight', vendor: 'אל על', sole: true },
  // אל על שולחת את הצ'ק-אין מדומיין נפרד לגמרי. הטבלה נכתבה מתוך ידע
  // כללי ולא מתוך השולחים האמיתיים בתיבה, ולכן החמיצה אותו — בדיוק
  // הטעות שהתחקיר עצמו מזהיר מפניה.
  'elal-check-in.com': { kind: 'flight', vendor: 'אל על', sole: true },
  'arkia.co.il': { kind: 'flight', vendor: 'ארקיע', sole: true },
  'israir.co.il': { kind: 'flight', vendor: 'ישראייר', sole: true },
  'ryanair.com': { kind: 'flight', vendor: 'Ryanair', sole: true },
  'easyjet.com': { kind: 'flight', vendor: 'easyJet', sole: true },
  'wizzair.com': { kind: 'flight', vendor: 'Wizz Air', sole: true },
  'lufthansa.com': { kind: 'flight', vendor: 'Lufthansa', sole: true },
  'ba.com': { kind: 'flight', vendor: 'British Airways', sole: true },
  'britishairways.com': { kind: 'flight', vendor: 'British Airways', sole: true },
  'airfrance.fr': { kind: 'flight', vendor: 'Air France', sole: true },
  'klm.com': { kind: 'flight', vendor: 'KLM', sole: true },
  'turkishairlines.com': { kind: 'flight', vendor: 'Turkish Airlines', sole: true },
  'aegeanair.com': { kind: 'flight', vendor: 'Aegean', sole: true },
  'iberia.com': { kind: 'flight', vendor: 'Iberia', sole: true },
  'united.com': { kind: 'flight', vendor: 'United', sole: true },
  'delta.com': { kind: 'flight', vendor: 'Delta', sole: true },
  'aa.com': { kind: 'flight', vendor: 'American Airlines', sole: true },

  // ── מלונות ולינה ──
  'airbnb.com': { kind: 'hotel', vendor: 'Airbnb', sole: true },
  'marriott.com': { kind: 'hotel', vendor: 'Marriott', sole: true },
  'hilton.com': { kind: 'hotel', vendor: 'Hilton', sole: true },
  'ihg.com': { kind: 'hotel', vendor: 'IHG', sole: true },
  'accor.com': { kind: 'hotel', vendor: 'Accor', sole: true },
  'hyatt.com': { kind: 'hotel', vendor: 'Hyatt', sole: true },
  'fattal.co.il': { kind: 'hotel', vendor: 'פתאל', sole: true },
  'isrotel.co.il': { kind: 'hotel', vendor: 'ישרוטל', sole: true },
  'dan.co.il': { kind: 'hotel', vendor: 'מלונות דן', sole: true },
  // מנוע הזמנות שמלונות רבים שולחים דרכו; השם בכותרת הוא שם המלון.
  'simplebooking.it': { kind: 'hotel', vendor: 'SimpleBooking', sole: true },

  // ── השכרת רכב ──
  'hertz.com': { kind: 'car_rental', vendor: 'Hertz', sole: true },
  'avis.com': { kind: 'car_rental', vendor: 'Avis', sole: true },
  'europcar.com': { kind: 'car_rental', vendor: 'Europcar', sole: true },
  'sixt.com': { kind: 'car_rental', vendor: 'Sixt', sole: true },
  'budget.com': { kind: 'car_rental', vendor: 'Budget', sole: true },
  'enterprise.com': { kind: 'car_rental', vendor: 'Enterprise', sole: true },
  'rentalcars.com': { kind: 'car_rental', vendor: 'Rentalcars', sole: true },
  'noleggiare.it': { kind: 'car_rental', vendor: 'Noleggiare', sole: true },
  'discovercars.com': { kind: 'car_rental', vendor: 'DiscoverCars', sole: true },

  // ── אטרקציות וסיורים ──
  'getyourguide.com': { kind: 'activity', vendor: 'GetYourGuide', sole: true },
  'viator.com': { kind: 'activity', vendor: 'Viator', sole: true },
  'tiqets.com': { kind: 'activity', vendor: 'Tiqets', sole: true },
  'klook.com': { kind: 'activity', vendor: 'Klook', sole: true },
  'musement.com': { kind: 'activity', vendor: 'Musement', sole: true },
  'headout.com': { kind: 'activity', vendor: 'Headout', sole: true },

  // ── ביטוח נסיעות ──
  // sole: false — אותה חברה שולחת גם פוליסה וגם הטבות נלוות. אצל המשתמש
  // PassportCard שלחה גם את הפוליסה וגם שובר טרקלין.
  'passportcard.co.il': { kind: 'insurance', vendor: 'PassportCard', sole: false },
  'harel-group.co.il': { kind: 'insurance', vendor: 'הראל', sole: false },
  'fnx.co.il': { kind: 'insurance', vendor: 'הפניקס', sole: false },
  'clalbit.co.il': { kind: 'insurance', vendor: 'כלל ביטוח', sole: false },
  'migdal.co.il': { kind: 'insurance', vendor: 'מגדל', sole: false },
  'davidshield.com': { kind: 'insurance', vendor: 'DavidShield', sole: false },

  // ── זכאויות: לעולם לא הזמנה ──
  'loungekey.com': { kind: 'benefit', vendor: 'LoungeKey', sole: true },
  'prioritypass.com': { kind: 'benefit', vendor: 'Priority Pass', sole: true },
  'dragonpass.com': { kind: 'benefit', vendor: 'DragonPass', sole: true },
  'collinsonassistance.com': { kind: 'benefit', vendor: 'Collinson', sole: true },

  // ── סוכנויות מקוונות: מוכרות הכל ──
  'booking.com': { kind: 'mixed', vendor: 'Booking.com', sole: false },
  'expedia.com': { kind: 'mixed', vendor: 'Expedia', sole: false },
  'agoda.com': { kind: 'mixed', vendor: 'Agoda', sole: false },
  'hotels.com': { kind: 'mixed', vendor: 'Hotels.com', sole: false },
  'trip.com': { kind: 'mixed', vendor: 'Trip.com', sole: false },
  'kiwi.com': { kind: 'mixed', vendor: 'Kiwi.com', sole: false },
  'edreams.com': { kind: 'mixed', vendor: 'eDreams', sole: false },
  'opodo.com': { kind: 'mixed', vendor: 'Opodo', sole: false },
  'gotogate.com': { kind: 'mixed', vendor: 'Gotogate', sole: false },
  'issta.co.il': { kind: 'mixed', vendor: 'ISSTA', sole: false },
  'daka90.co.il': { kind: 'mixed', vendor: 'דקה 90', sole: false },
};

/**
 * הדומיין מתוך כותרת From.
 *
 * הכותרת מגיעה בצורות שונות — `"אל על" <noreply@elal.co.il>`, כתובת
 * חשופה, ולעיתים עם תווי כיווניות סביב הסוגריים בגלל העברית. לכן
 * החילוץ מחפש את הכתובת ולא מפרק את המחרוזת לפי רווחים.
 */
export const domainOf = (from = '') => {
  const m = /[\w.+-]+@([\w-]+(?:\.[\w-]+)+)/.exec(String(from));
  return m ? m[1].toLowerCase() : '';
};

/**
 * זיהוי הספק לפי כתובת השולח.
 *
 * ההתאמה היא על סיומת הדומיין ולא על שוויון מלא: מיילים יוצאים מתת-
 * דומיינים (`mail.booking.com`, `e.getyourguide.com`, `news.elal.co.il`),
 * והשוואה מדויקת הייתה מחמיצה כמעט את כולם.
 *
 * @returns {{domain:string, kind:SenderKind, vendor:string, sole:boolean}|null}
 */
export const identifySender = (from = '') => {
  const domain = domainOf(from);
  if (!domain) return null;

  // הדומיין הארוך ביותר שמתאים, כדי ש-`co.il` לא יתפוס לפני `elal.co.il`
  let best = null;
  Object.keys(DOMAINS).forEach((known) => {
    if (domain !== known && !domain.endsWith(`.${known}`)) return;
    if (!best || known.length > best.length) best = known;
  });

  return best ? { domain, ...DOMAINS[best] } : null;
};

/**
 * האם המסמך הוא זכאות ולא הזמנה.
 *
 * זו הקביעה היחידה כאן שמותר לה לפסול מסמך על הסף, והיא מותנית ב-`sole`:
 * רק ספק שכל תוצרתו זכאויות. חברת ביטוח ששולחת גם שובר טרקלין אינה
 * נכנסת לכאן — שם ההכרעה נשארת בקריאת המסמך.
 */
export const isEntitlementSender = (from = '') => {
  const id = identifySender(from);
  return !!id && id.kind === 'benefit' && id.sole === true;
};

/**
 * שורת ההקשר שנמסרת למודל.
 *
 * נמסר גם מה הדומיין מוכיח וגם מה הוא אינו מוכיח. שורה שאומרת רק
 * "השולח הוא PassportCard" הייתה מטה כל מסמך של אותה חברה לכיוון
 * פוליסה — כולל שובר הטרקלין שהיא עצמה שלחה.
 */
export const senderHint = (from = '') => {
  const id = identifySender(from);
  if (!id) return from ? `שולח: ${from}` : '';

  const what = {
    flight: 'חברת תעופה',
    hotel: 'ספק לינה',
    car_rental: 'חברת השכרת רכב',
    activity: 'פלטפורמת אטרקציות וסיורים',
    insurance: 'חברת ביטוח',
    benefit: 'תוכנית הטבות — זכאות, לא הזמנה',
    mixed: 'סוכנות מקוונת המוכרת כמה סוגי מוצרים',
  }[id.kind];

  return id.sole
    ? `שולח: ${from} — ${id.vendor}, ${what}. זהו סוג המסמך היחיד שספק זה שולח.`
    : `שולח: ${from} — ${id.vendor}, ${what}. ספק זה שולח כמה סוגי מסמכים; אין להסיק את הסוג מהשולח בלבד.`;
};

export default { identifySender, domainOf, isEntitlementSender, senderHint };
