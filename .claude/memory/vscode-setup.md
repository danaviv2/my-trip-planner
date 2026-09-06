---
name: vscode-setup
description: "איזו התקנת VS Code היא הנכונה, מאיפה בא `code`, ואיפה יושבת היסטוריית ההגדרות"
metadata:
  type: reference
---

**`/Applications/Visual Studio Code 7.app` היא ההתקנה — ואין אחרת.**
גרסה 1.136.1 (נמדד 06.09.2026), בלי דגל quarantine. הסיומת " 7" נוצרה רק
משום ש-macOS סירב לדרוס גרסה ישנה יותר.

עד אוגוסט 2026 ישבה לצידה `/Applications/Visual Studio Code.app` בגרסה
1.97.0, עם quarantine שגרם ל-macOS להריץ אותה מ-AppTranslocation — מסלול
זמני שבו `code` אינו נרשם. **היא כבר לא קיימת**, והבלבול הזה נגמר.

`~/.local/bin/code` הוא קישור סימבולי אליה (התיקייה ב-`PATH` דרך
`~/.zshrc`), ולכן `code <path>` פותח את הגרסה הנכונה.

המחשב הוא **Intel i9**, לא Apple Silicon — build של x64 הוא הנכון כאן.

## שחזור הגדרות

VS Code שומר היסטוריה מקומית של `settings.json`, וזה מקור השחזור האמיתי
כשמשהו משתבש — לא צריך Time Machine ולא Settings Sync (שאינו מופעל כאן):

```
~/Library/Application Support/Code/User/History/*/entries.json
```

מאתרים את התיקייה שבה `resource` מסתיים ב-`/User/settings.json`,
וממיינים את `entries` לפי `timestamp`. כל גרסה שמורה בקובץ נפרד לפי `id`.
כך שוחזר ב-06.09.2026 המצב שלפני עריכה שגויה, בייט-לבייט.

קשור: [[project-location]]
