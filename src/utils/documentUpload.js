// utils/documentUpload.js
//
// הכנת קובץ שהמשתמש העלה או צילם, לפני שהוא נשלח לפענוח.
//
// ── למה הקטנה ──
// צילום מטלפון שוקל 3–8MB. בקידוד base64 הוא גדל בשליש, ושער Gemini דוחה
// גוף מעל 4.4MB (`GEMINI_MAX_BYTES` ב-api/gemini.mjs, מתחת לתקרת Vercel של
// 4.5MB). צילום בגודל מלא היה נכשל ב-413 — אותה תקלה בדיוק שהפילה את קבצי
// ה-PDF בסריקת Gmail עד 14.09.2026. כרטיס טיסה נקרא היטב גם ב-2000px.
//
// ── ומה לא מוקטן ──
// PDF נשלח כמו שהוא: הקטנה פירושה רינדור לתמונה, ואיבוד הטקסט שבקובץ.
// HEIC, כשהדפדפן אינו יודע לפענח אותו (Chrome), נשלח כמו שהוא — Gemini
// קורא HEIC. אם גם הוא גדול מדי, המשתמש מקבל הודעה במקום 413 אילם.

/** אותה תקרה כמו לקובץ מצורף בסריקת Gmail (`MAX_PDF_BYTES`). */
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

const MAX_EDGE_PX = 2000;
const JPEG_QUALITY = 0.85;

const toBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error || new Error('READ_FAILED'));
  reader.readAsDataURL(blob);
});

/** סוג הקובץ לפי ה-MIME, ולפי הסיומת כשהדפדפן לא מסר MIME (HEIC ב-Chrome). */
export const documentKind = (file) => {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return { kind: 'document', mime: 'application/pdf' };
  if (type === 'image/heic' || name.endsWith('.heic')) return { kind: 'image', mime: 'image/heic' };
  if (type === 'image/heif' || name.endsWith('.heif')) return { kind: 'image', mime: 'image/heif' };
  if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) return { kind: 'image', mime: type };
  if (/\.(jpe?g)$/.test(name)) return { kind: 'image', mime: 'image/jpeg' };
  if (name.endsWith('.png')) return { kind: 'image', mime: 'image/png' };
  if (name.endsWith('.webp')) return { kind: 'image', mime: 'image/webp' };
  if (/\.(eml|txt)$/.test(name) || type === 'text/plain' || type === 'message/rfc822') return { kind: 'text', mime: 'text/plain' };
  return { kind: 'unsupported', mime: type };
};

const shrinkImage = async (file) => {
  // createImageBitmap נכשל על פורמט שהדפדפן אינו מפענח — ואז אין מה להקטין.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) throw new Error('ENCODE_FAILED');
    return blob;
  } finally {
    bitmap.close?.();
  }
};

/**
 * @returns {Promise<{base64: string, mime: string}>}
 * @throws Error('UNSUPPORTED_TYPE' | 'TOO_LARGE')
 */
export const prepareDocument = async (file) => {
  const { kind, mime } = documentKind(file);
  if (kind !== 'document' && kind !== 'image') throw new Error('UNSUPPORTED_TYPE');

  // גם HEIC מנוסה: Safari מפענח אותו, ואז הוא יוצא JPEG קטן. Chrome נכשל ונופל למקור.
  if (kind === 'image') {
    try {
      const blob = await shrinkImage(file);
      return { base64: await toBase64(blob), mime: 'image/jpeg' };
    } catch {
      // הדפדפן לא פענח — ממשיכים עם הקובץ המקורי, כפוף לתקרה.
    }
  }

  if (file.size > MAX_UPLOAD_BYTES) throw new Error('TOO_LARGE');
  return { base64: await toBase64(file), mime };
};
