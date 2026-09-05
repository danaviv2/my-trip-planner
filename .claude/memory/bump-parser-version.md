---
name: bump-parser-version
description: "שינוי בפרומפט או בשדות מחייב העלאת PARSER_VERSION באותו commit"
metadata:
  type: project
---

`src/services/scanLedgerService.js` מחזיק `PARSER_VERSION`. כל מייל
שפוענח נשמר ביומן יחד עם הגרסה, והסריקה הבאה **מדלגת עליו**.

ב-05.09.2026 שוּנו ההנחיות למודל שלוש פעמים ברצף — קליטת מסעדות,
העברת תאריך המייל, וכללי פענוח — בלי להעלות את הגרסה. סריקה חיה
החזירה 15 מיילים ואפס הזמנות, בעוד אישורי המסעדות ישבו בתיבה ועברו
את מסנן המילים. הם לא הובאו כלל.

**Why:** הסימפטום נראה כמו כשל פענוח, והוא היה כשל מטמון. חיפוש
הסיבה בפרומפט היה מבזבז סיבובים שלמים.

**How to apply:** כל commit שנוגע ב-`bookingParserService` (פרומפט
או מבנה שדות) או במה שנשלח למודל ב-`bookingScanService` — מעלה את
`PARSER_VERSION` **באותו commit**, עם הערה שמסבירה מה השתנה.

קשור: [[pipeline-not-the-obvious-function]]
