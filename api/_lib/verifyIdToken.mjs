/**
 * אימות אסימון זהות של Firebase, בלי ה-Admin SDK.
 *
 * הדרך המקובלת היא getAuth().verifyIdToken, אך היא נכשלת בסביבת הריצה כאן:
 * firebase-admin/auth תלוי ב-jwks-rsa, שמנסה require() על מודול ES — והריצה
 * נופלת עוד לפני שהפונקציה מתחילה:
 *
 *   require() of ES Module dist/webapi/index.js from jwks-rsa/src/utils.js
 *   not supported
 *
 * במקום זה נעשית קריאה ל-Identity Toolkit, שהוא השירות שהנפיק את האסימון.
 * הוא מאמת חתימה, תוקף וקהל יעד בעצמו, ומחזיר את המשתמש כשהאסימון תקף.
 * היתרון: אין תלות בספריית הצפנה, ואין העתק של לוגיקת אימות אצלנו — מה
 * שהיה מקור נוסף לטעות.
 *
 * המפתח כאן הוא מפתח ה-web הציבורי של Firebase. הוא מגיע לדפדפן בכל מקרה
 * ואינו סוד; ההגנה על הנתונים היא בחוקי האבטחה ולא בהסתרתו.
 */

const WEB_API_KEY = 'AIzaSyAeQ8o6IacieEB64I6aZciSBnxoOKukw3I';
const ENDPOINT = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

/**
 * @returns {Promise<{ok:true, uid:string, email:string} | {ok:false, status:number, error:string}>}
 *   התוצאה מבחינה בין אסימון פסול (401, תקלת משתמש) ובין כשל בשירות
 *   (502, תקלת שרת). הודעה אחת לשתיהן הייתה שולחת לכיוון הלא נכון.
 */
export const verifyIdToken = async (idToken) => {
  if (!idToken) return { ok: false, status: 401, error: 'חסר אסימון זהות.' };

  let res;
  try {
    res = await fetch(`${ENDPOINT}?key=${WEB_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch (err) {
    return { ok: false, status: 502, error: `אימות הזהות לא זמין: ${err?.message || err}` };
  }

  if (res.status === 400 || res.status === 401) {
    return { ok: false, status: 401, error: 'אסימון הזהות אינו תקף. התחבר מחדש ונסה שוב.' };
  }
  if (!res.ok) {
    return { ok: false, status: 502, error: `אימות הזהות נכשל בשירות (${res.status}).` };
  }

  const data = await res.json().catch(() => null);
  const user = data?.users?.[0];
  if (!user?.localId) {
    return { ok: false, status: 401, error: 'אסימון הזהות אינו תקף.' };
  }

  return { ok: true, uid: user.localId, email: user.email || '' };
};
