---
name: project-location
description: "היכן נמצא הפרויקט my-trip-planner, ומה לעשות כשתיקיית העבודה נעלמת"
metadata: 
  node_type: memory
  type: project
  originSessionId: 91801612-2c51-4184-af36-22b0affce6dd
  modified: 2026-08-18T15:38:00.624Z
---

תיקיית העבודה: `~/Desktop/פרויקטים/my-trip-planner`
מקור אמת: https://github.com/danaviv2/my-trip-planner (ענף `main`)

ב-18.8.2026 תיקיית העבודה הקודמת `~/Desktop/my-trip-planner` נעלמה
מהמחשב. הקוד היה שלם ב-GitHub, ושוחזר בשכפול לנתיב שלמעלה לפי בחירת
המשתמש.

**קבצי הסביבה אינם ב-git** (`.env`, `.env.production.local`) ולכן שכפול
לבדו אינו מספיק — יש לחלץ אותם מארכיון ב-`~/Desktop/backups/*.tar.gz`,
אחרת האפליקציה עולה בלי מפתחות.

זהירות: `~/Desktop/backups/my-trip-planner` הוא עותק מפוענח **בלי git
ובלי התיקונים האחרונים**. אין לערוך אותו בטעות — ההבדל אינו נראה לעין.

**שתי תיקיות ששמן מבטיח יותר ממה שיש בהן** — אין לעבוד בהן:
`~/Desktop/פרויקטים/my-trip-planner-backup-FINAL-WORKING` מכילה רק
`craco.config.js`, `node_modules` ותיקייה ריקה, בלי git ובלי קוד; לצידה
`my-trip-planner-backup-2026-02-23`. ב-23.8.2026 נפתח שם סשן בטעות.

**קריאה של הפרויקט לפני שהוענקה גישה לתיקייה מחזירה תמונה ישנה.** באותו
בוקר `git log` הראה קומיט אחד פחות ו-`STATUS.md` נקרא בגרסה קודמת; אחרי
המעבר לתיקייה שניהם היו מעודכנים. אין להסיק מצב ריפו לפני הגישה.

קשור: [[live-site-and-deploy]] · [[memory-lives-in-git]]
