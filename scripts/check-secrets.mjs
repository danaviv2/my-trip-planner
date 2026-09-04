#!/usr/bin/env node
/**
 * תופס קובץ סודות שאינו מוגן מפני גיט, בסוף כל שיחה.
 *
 * ── הכשל שהוליד את הקובץ הזה ──
 * ב-04.09.2026 הוצעה כאן פקודה שכתבה ל-`.env.tmp` ואז העבירה אותו במקום.
 * `.gitignore` מכסה `.env`, `.env.backup`, `.env.bak` ו-`.env.save` —
 * אבל **לא** `.env.tmp`. אילו משהו היה נקטע בין הכתיבה ל-`mv`, היה נשאר
 * בתיקייה קובץ עם כל המפתחות, גלוי לגיט, ו-`git add -A` הבא היה דוחף
 * אותו. זה נתפס בבדיקה יזומה ולא בכלי, ולכן נבנה הכלי.
 *
 * ── מה הוא בודק ──
 * 1. קובץ בשם דמוי-סודות בשורש שאינו מכוסה ב-`.gitignore`.
 * 2. קובץ כזה שכבר עוקב אחריו גיט — חמור יותר, כי הוא כבר בהיסטוריה.
 * 3. קובץ כזה שמוכן ל-commit.
 *
 * הוא **אינו** סורק תוכן ואינו מחפש מפתחות בתוך קוד: שם קובץ הוא סימן
 * ודאי, ואילו חיפוש תבניות בתוכן מייצר התרעות שווא — ואזהרה שגויה אחת
 * מלמדת להתעלם מכולן.
 */

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const RISKY = /^\.env($|\.)|\.(pem|key|p12|keystore)$|credentials\.json$|service-account.*\.json$/i;

const git = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

const ignored = (f) => {
  try {
    execSync(`git check-ignore -q -- ${JSON.stringify(f)}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const problems = [];

for (const f of readdirSync('.')) {
  if (!RISKY.test(f)) continue;
  if (!ignored(f)) problems.push(`${f} — אינו מכוסה ב-.gitignore`);
}

for (const f of git('git ls-files').split('\n').filter(Boolean)) {
  if (RISKY.test(f.split('/').pop())) problems.push(`${f} — כבר עוקב אחריו גיט`);
}

for (const f of git('git diff --cached --name-only').split('\n').filter(Boolean)) {
  if (RISKY.test(f.split('/').pop())) problems.push(`${f} — מוכן ל-commit`);
}

if (problems.length) {
  console.error('⚠️  קובץ סודות חשוף לגיט:');
  for (const p of [...new Set(problems)]) console.error(`   • ${p}`);
  console.error('   הוסף ל-.gitignore, או הסר מהמעקב: git rm --cached <קובץ>');
  process.exit(2);
}
