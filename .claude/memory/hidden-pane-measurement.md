---
name: hidden-pane-measurement
description: חלונית הדפדפן המוסתרת נותנת מדידות פריסה/אנימציה שגויות — להשתמש ב-Playwright
metadata:
  type: feedback
---

כשחלונית הדפדפן של האפליקציה מוסתרת, `document.visibilityState` הוא hidden: טיימרים ואנימציות
נעצרים, `innerHeight` יכול להיות 0, וצילום מסך יוצא לבן. ב-14.09.2026 זה נתן מגירה "תקועה"
ב-‎-260px שנראתה כבאג RTL, ו-`await setTimeout` שלא חזר (timeout 45s).

**Why:** מדידה פגומה נראית בדיוק כמו ממצא — אותה מלכודת שמתועדת ב-CLAUDE.md.

**How to apply:** לפריסה, מעברים, גלילה וצילומי מסך — `mcp__playwright__*` (רינדור אמיתי).
החלונית טובה לקריאת DOM וטקסט. אחרי Playwright להעביר את `.playwright-mcp/` וקבצי png מהשורש
ל-scratchpad. ראה [[rtl-noflip]].
