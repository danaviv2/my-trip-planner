#!/usr/bin/env node
/**
 * מאמת שמחיקת חשבון מכירה כל תת-אוסף שהקוד כותב תחת `users/{uid}`.
 *
 * הכשל שהביא אותו: הרשימה ב-`accountService` נכתבה מקריאת הקוד ופספסה
 * חמישה אוספים. נמדד 13.09.2026 בחשבון אמיתי — שלושה מהם החזיקו
 * נתונים, ביניהם מינויי התראות. שום דבר לא נכשל: המחיקה הייתה מדווחת
 * הצלחה ומשאירה אותם.
 *
 * הדפדפן אינו יכול למנות תת-אוספים, ולכן הרשימה מפורשת. הבודק סורק
 * את `src/` ואת `api/` ומשווה. אוסף חדש שיתווסף בלי לעדכן את הרשימה
 * נכשל כאן, ולא אצל משתמש שמחק את חשבונו.
 *
 * שימוש: node scripts/check-account-deletion.mjs [שורש]
 * השורש ניתן להחלפה כדי לבדוק את הבודק על עותק.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || '.';
const SERVICE = join(ROOT, 'src/services/accountService.js');

// קבצי גיבוי יושבים ליד קוד חי ב-src/pages ואינם רצים.
const DEAD = /\.(backup_|bak|fix\d)|_old_backup/;

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(m?js|jsx|ts)$/.test(name) && !DEAD.test(name)) out.push(p);
  }
  return out;
};

// ── שלוש צורות שבהן הקוד כותב תחת משתמש ──
// 1. `doc(db, 'users', uid, 'X', ...)` / `collection(db, 'users', uid, 'X')`
// 2. עוזר שמקבל את שם האוסף: `markDeleted(uid, 'X', ...)`,
//    `loadDeletedIds(uid, 'X')`, `clearCollection(uid, ...)` על מערך מילולי
// 3. צד השרת (Admin SDK): `.collection('users').doc(uid).collection('X')`,
//    או `userRef.collection('X')` / `ref.collection('X')`
const PATTERNS = [
  /['"]users['"]\s*,\s*[\w.]+\s*,\s*['"]([A-Za-z]+)['"]/g,
  /\b(?:markDeleted|loadDeletedIds)\(\s*[\w.]+\s*,\s*['"]([A-Za-z]+)['"]/g,
  /\b(?:userRef|ref)\s*\.collection\(\s*['"]([A-Za-z]+)['"]/g,
  /\.doc\(\s*uid\s*\)\s*\.collection\(\s*['"]([A-Za-z]+)['"]/g,
];

const found = new Map(); // name -> [file:line]
const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'api'))];
for (const file of files) {
  if (file.endsWith('accountService.js')) continue; // הרשימה עצמה אינה עדות
  const text = readFileSync(file, 'utf8');
  for (const re of PATTERNS) {
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split('\n').length;
      if (!found.has(m[1])) found.set(m[1], []);
      found.get(m[1]).push(`${file}:${line}`);
    }
  }
  // clearCollection(user.uid, name) על מערך מילולי שלפניו
  for (const m of text.matchAll(/\[([^\]]+)\]\s*\.map\(\s*\(?\s*name\s*\)?\s*=>\s*\n?\s*clearCollection/g)) {
    for (const n of m[1].matchAll(/['"]([A-Za-z]+)['"]/g)) {
      if (!found.has(n[1])) found.set(n[1], []);
      found.get(n[1]).push(`${file}:${text.slice(0, m.index).split('\n').length}`);
    }
  }
}

const serviceText = readFileSync(SERVICE, 'utf8');
const block = serviceText.match(/const SUBCOLLECTIONS\s*=\s*\[([\s\S]*?)\]/);
if (!block) {
  console.error('✘ SUBCOLLECTIONS לא נמצא ב-accountService — הבודק אינו יכול לרוץ');
  process.exit(2);
}
const listed = new Set([...block[1].matchAll(/['"]([A-Za-z]+)['"]/g)].map((m) => m[1]));

// ── בדיקה עצמית: בודק שלא מצא דבר אינו מוכיח דבר ──
// `trips` ו-`bookings` נכתבים בוודאות. אם הם לא נמצאו, התבניות שבורות
// ו"אין חוסרים" היה שקר.
for (const must of ['trips', 'bookings']) {
  if (!found.has(must)) {
    console.error(`✘ הבודק לא מצא את '${must}' בקוד — התבניות שבורות, התוצאה אינה אמינה`);
    process.exit(2);
  }
}

const missing = [...found.keys()].filter((n) => !listed.has(n)).sort();
const unused = [...listed].filter((n) => !found.has(n)).sort();

if (missing.length) {
  console.error('✘ אוספים שהקוד כותב ומחיקת החשבון אינה מוחקת:');
  for (const n of missing) console.error(`   ${n}  ←  ${found.get(n).slice(0, 3).join(', ')}`);
  process.exit(1);
}
console.log(`✔ מחיקת החשבון מכסה את כל ${found.size} האוספים שהקוד כותב תחת users/{uid}`);
if (unused.length) {
  console.log(`  ברשימה ואינם נכתבים היום (נשמרים לנתונים ישנים): ${unused.join(', ')}`);
}
