---
name: vscode-setup
description: "שתי התקנות VS Code במחשב — איזו היא הנכונה, ולמה השמות מטעים"
metadata:
  type: reference
---

במחשב שתי התקנות של VS Code, והשמות מטעים בדיוק הפוך מהאינטואיציה:

- **`/Applications/Visual Studio Code 7.app` — זו הנכונה.** גרסה 1.133.0
  (אוגוסט 2026). הסיומת " 7" נוצרה רק משום ש-macOS סירב לדרוס את הישנה.
- `/Applications/Visual Studio Code.app` — גרסה **1.97.0 מפברואר 2025**.
  נושאת דגל quarantine ולכן macOS מריץ אותה מ-AppTranslocation, מסלול זמני
  שבו פקודת `code` אינה נרשמת. ב-23.8.2026 נפתחה בטעות דווקא היא.

`~/.local/bin/code` הוא קישור סימבולי ל-1.133.0 (התיקייה נמצאת ב-`PATH`
דרך `~/.zshrc`). מכאן `code <path>` פותח את הגרסה הנכונה.

המחשב הוא **Intel i9**, לא Apple Silicon — build של x64 הוא הנכון כאן, ואין
כאן בעיית Rosetta.

קשור: [[project-location]]
