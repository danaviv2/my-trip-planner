---
name: lottie-and-asset-weight
description: LottieFiles מחובר תחת שם גנרי, וגודל מוצהר של נכס אינו הגודל שהדפדפן טוען
metadata:
  type: reference
---

**LottieFiles MCP מחובר** — אבל רשום תחת שם גנרי, וכליו הם
`graphql_execute`, `operations_list`, `schema_details`, `schema_search`.
ב-12.09.2026 נקבע כאן ש"הוא אינו מחובר" על סמך חיפוש כלים לפי המילה
`lottie` שהחזיר אפס. השרת היה מחובר כל הזמן, והכלים עברו מול העיניים
ונפסלו כ"שרת GraphQL כללי". המשתמש הוא שתיקן.

**חיפוש שהחזיר ריק הוא לעתים קרובות המכשיר, לא הממצא.** כשכלי לא נמצא
לפי שם, סרוק את הרשימה לפי יכולת.

השאילתה: `searchPublicAnimations(first, query)` → `jsonUrl`, `name`, `id`.

---

**גודל מוצהר אינו גודל אמיתי.** השדה `lottieFileSize` מתאר את קובץ
ה-`.lottie` הדחוס, לא את ה-JSON שהדפדפן טוען:

| אנימציה | מוצהר | בפועל |
|---|---|---|
| `hand TAP` | 2,398 בייט | **140KB** + תלות בתמונה מרוחקת |
| `travel-aviation` | — | **20,750KB** — 154 שכבות תמונה |

**לפני שמכניסים נכס, פותחים אותו ובודקים:** `assets[]` (תלויות
חיצוניות פוסלות), `layers[].ty` (4=צורה טוב, 2=תמונה חשוד), ביטויים
(`"x":"` — ה-build הקל לא תומך בהם), ומשקל ה-JSON עצמו.

נבחרו בסוף: `map-line` (5.5KB, שני צבעים) ו-`flying-plane` (31KB).
ראה [[empty-state-over-tour]] ו-`src/components/common/LottieArt.jsx`.
