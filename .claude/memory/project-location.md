---
name: project-location
description: "היכן נמצא הפרויקט my-trip-planner, למה הוא אינו יושב על שולחן העבודה, ומה לעשות כשתיקיית העבודה נעלמת"
metadata: 
  node_type: memory
  type: project
  originSessionId: 91801612-2c51-4184-af36-22b0affce6dd
  modified: 2026-08-27T09:20:00.000Z
---

תיקיית העבודה: `~/Developer/my-trip-planner`
מקור אמת: https://github.com/danaviv2/my-trip-planner (ענף `main`)

**אין להחזיר את הפרויקט לשולחן העבודה.** ב-27.8.2026 התברר ש-
`~/Library/Mobile Documents/com~apple~CloudDocs/Desktop` הוא קישור אל
`~/Desktop`, כלומר שולחן העבודה מסונכרן ל-iCloud — והפרויקט היה בתוכו.
iCloud פינה את תוכן הקבצים והשאיר שמות בלבד: `node_modules/pako/index.js`
נשא `flags=compressed,dataless` ו-`blocks=0`, ו-125,152 קבצים תפסו 1.3MB
במקום מאות מגה. הם היו ריקים.

**מה זה שבר:** `npm start` יצא עם קוד 0 בלי שורת שגיאה אחת, שלוש פעמים;
העתקת התיקייה זחלה בקצב 71 קבצים בשתי דקות, כי כל קובץ נשאב מהרשת;
ו-`bird`/`fileproviderd` הציפו את הזיכרון בכל בנייה. אחרי המעבר: אותו
קובץ נושא `flags=-` ו-`blocks=8`, ו-`npm install` סיים 1,649 חבילות
ב-35 שניות.

**סימן ההיכר:** `du -sh` שמדווח מגהבייטים בודדים על עשרות אלפי קבצים.
`stat -f "%Sf" <קובץ>` יראה `dataless`. זה לא באג בקוד — זו הסביבה.

**אין להעתיק תיקייה פגומה כזו — יש לשכפל מ-GitHub.** ההעתקה מושכת כל
קובץ מ-iCloud ומשחזרת את העומס; שכפול מגיע מהרשת ישירות. הכל היה דחוף
(`main...origin/main`, אפס קומיטים מאחור), ולכן השכפול היה שלם.

**קבצי הסביבה אינם ב-git** (`.env`, `.env.production.local`, וגם
`.claude/launch.json`) ולכן שכפול לבדו אינו מספיק — יש לגבות אותם *לפני*
כל מעבר, אחרת האפליקציה עולה בלי מפתחות.

**מפתח תיקיית הזיכרון נגזר מהנתיב**, ולכן מעבר מייתם אותה. אחרי המעבר
נוצר `~/.claude/projects/-Users-danaviv-Developer-my-trip-planner` עם
קישור `memory` אל `.claude/memory` שבריפו, והתמלולים הועברו לשם.

**תיקיות ששמן מבטיח יותר ממה שיש בהן** — אין לעבוד בהן:
`~/Desktop/פרויקטים/my-trip-planner` (הישנה, פגומת iCloud),
`~/Desktop/פרויקטים/my-trip-planner-backup-FINAL-WORKING` שמכילה רק
`craco.config.js` ו-`node_modules`, `my-trip-planner-backup-2026-02-23`,
ו-`~/Desktop/backups/my-trip-planner` שהוא עותק מפוענח בלי git.

**קריאה של הפרויקט לפני שהוענקה גישה לתיקייה מחזירה תמונה ישנה.** באותו
בוקר `git log` הראה קומיט אחד פחות ו-`STATUS.md` נקרא בגרסה קודמת; אחרי
המעבר לתיקייה שניהם היו מעודכנים. אין להסיק מצב ריפו לפני הגישה.

קשור: [[live-site-and-deploy]] · [[memory-lives-in-git]]
