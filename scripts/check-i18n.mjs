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

// ── סיומות ריבוי אינן מפתחות חסרים ──
// i18next בוחר סיומת לפי Intl.PluralRules של השפה. לעברית יש
// one/two/other ולאנגלית רק one/other, ולכן `flight_two` *אמור*
// להיעדר מאנגלית — i18next לעולם לא יחפש אותו שם.
// השוואה שטוחה סימנה תשעה מפתחות כאלה כחסרים בארבע שפות, וזו
// אזהרה על מצב תקין: בודק שצועק על מה שנכון מאמן להתעלם ממנו.
//
// לכן מפתח עם סיומת ריבוי נבדק מול הקטגוריות שהשפה *באמת* מכירה.
const PLURAL = ['zero', 'one', 'two', 'few', 'many', 'other'];
const catsFor = (lang) => {
  const pr = new Intl.PluralRules(lang);
  const seen = new Set();
  for (const n of [0, 1, 2, 3, 6, 11, 20, 100, 101]) seen.add(pr.select(n));
  seen.add('other'); // תמיד קיימת כברירת מחדל
  return seen;
};

/** מפצל `a.b.flight_two` ל-{ stem: 'a.b.flight', cat: 'two' }, או cat=null. */
const splitPlural = (key) => {
  const i = key.lastIndexOf('_');
  if (i < 0) return { stem: key, cat: null };
  const cat = key.slice(i + 1);
  return PLURAL.includes(cat) ? { stem: key.slice(0, i), cat } : { stem: key, cat: null };
};

/** המפתחות שהשפה הזו אמורה להחזיק, בהינתן מה שיש בשפת הבסיס. */
const expectedFor = (baseKeys, lang) => {
  const cats = catsFor(lang);
  const out = new Set();
  for (const k of baseKeys) {
    const { stem, cat } = splitPlural(k);
    if (!cat) { out.add(k); continue; }
    // גזע ריבוי: מצפים לו פעם אחת לכל קטגוריה שהשפה מכירה
    for (const c of cats) out.add(`${stem}_${c}`);
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
  const expected = expectedFor(keys[BASE], lang);
  const missing = [...expected].filter((k) => !keys[lang].has(k));
  const extra = [...keys[lang]].filter((k) => !expected.has(k));
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
