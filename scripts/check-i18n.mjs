#!/usr/bin/env node
/**
 * מאמת שחמשת קבצי התרגום מסכימים ביניהם.
 *
 * שני כשלים אמיתיים שקרו כאן, ושניהם עברו כל בדיקת נוכחות:
 *
 * 1. `"map"` מופיע פעמיים ב-he.json. מפתחות חדשים נחתו בבלוק המקונן,
 *    והמסך הציג למשתמש את המחרוזת הגולמית `map.geocodeFailed`.
 * 2. מפתח שנוסף לשפה אחת בלבד — נראה תקין בעברית, ריק בכל השאר.
 *
 * הבדיקה היא על **מערך המפתחות המלא בכל עומק**, ולכן מפתח שיושב
 * במקום הלא נכון נראה כחסר בארבע השפות האחרות ונתפס.
 */
import { readFileSync } from 'node:fs';

// ניתן להצביע על תיקייה אחרת, כדי שאפשר יהיה לבדוק את הבודק עצמו
// על עותק — בלי לגעת בקבצים החיים.
const DIR = process.argv[2] || 'src/i18n/locales';
const LOCALES = ['he', 'en', 'es', 'fr', 'pt'];
const BASE = 'he';

const flatten = (obj, prefix = '', out = new Set()) => {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out.add(path);
  }
  return out;
};

const keys = {};
let failed = false;

for (const lang of LOCALES) {
  const file = `${DIR}/${lang}.json`;
  try {
    keys[lang] = flatten(JSON.parse(readFileSync(file, 'utf8')));
  } catch (err) {
    console.error(`✘ ${file}: JSON שבור — ${err.message}`);
    process.exit(2);
  }
}

for (const lang of LOCALES) {
  if (lang === BASE) continue;
  const missing = [...keys[BASE]].filter((k) => !keys[lang].has(k));
  const extra = [...keys[lang]].filter((k) => !keys[BASE].has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✘ ${lang}: חסרים ${missing.length}, עודפים ${extra.length}`);
    missing.slice(0, 5).forEach((k) => console.error(`    חסר ב-${lang}: ${k}`));
    extra.slice(0, 5).forEach((k) => console.error(`    קיים רק ב-${lang}: ${k}`));
  }
}

if (failed) {
  console.error('\nמפתח שנוסף לשפה אחת, או שנחת בבלוק מקונן במקום בעליון,');
  console.error('מוצג למשתמש כמחרוזת גולמית. תקן לפני שממשיכים.');
  process.exit(2);
}

console.log(`✔ i18n תקין — ${keys[BASE].size} מפתחות זהים בכל ${LOCALES.length} השפות`);
