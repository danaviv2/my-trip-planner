// utils/noflip.js
//
// ערך CSS פיזי שאסור ל-`stylis-plugin-rtl` להפוך.
//
// ── למה זה קיים ──
// בעברית עובר ה-CSS של הרכיבים דרך `stylis-plugin-rtl`, שהופך כל
// left/right: `margin-left` ⟵ `margin-right`, `text-align: right` ⟵
// `left`, ואפילו `direction: rtl` ⟵ `ltr`. זה מה שמתקן את רכיבי MUI,
// שנכתבו משמאל לימין. אבל בקוד הזה נכתבו עשרות ערכים **במכוון** לעברית
// — `direction: 'rtl'` לתוכן שתמיד בעברית, `direction: 'ltr'` לקישור
// או לכתובת מייל. הפיכה שלהם שוברת בדיוק את מה שהם תיקנו.
// נמדד 13.09.2026: טופס ההתחברות נשאר חופף אחרי הפעלת התוסף, כי ה-Paper
// שלו הגדיר `direction` והתוסף הפך אותו ל-`ltr`.
//
// ההערה `@noflip` בתוך הערך נקראת על ידי cssjanus (שהתוסף עוטף) ומדלגת
// על ההצהרה הזו בלבד. אומת מול התוסף עצמו, לא לפי התיעוד.
//
// שימוש: `sx={{ direction: noflip('rtl'), textAlign: noflip('right') }}`
// ערך לוגי (`textAlign: 'start'`) אינו צריך את זה — הוא נכון בשני הכיוונים.
export const noflip = (value) => `${value} /* @noflip */`;
