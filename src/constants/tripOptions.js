// אפשרויות בחירה לטופס העדפות הטיול.
// הוצאו מ-App.js כדי שרכיבים מחולצים יוכלו להשתמש בהן ללא תלות בסקופ של App.

export const travelStyles = [
  { value: 'cultural', label: 'תרבותי - מוזיאונים, היסטוריה, אמנות' },
  { value: 'adventure', label: 'הרפתקני - טיולים, ספורט אתגרי' },
  { value: 'relaxation', label: 'מנוחה - ספא, חופים, הרפיה' },
  { value: 'culinary', label: 'קולינרי - אוכל, יין, שווקים' },
  { value: 'nature', label: 'טבע - פארקים, נופים, חיות בר' },
  { value: 'urban', label: 'עירוני - קניות, אטרקציות עירוניות' },
  { value: 'mixed', label: 'מעורב - שילוב של מספר סגנונות' }
];

// הגדרת רמות קצב לשימוש בטופס העדפות
export const paceLevels = [
  { value: 'slow', label: 'איטי - מעט פעילויות, הרבה זמן פנוי' },
  { value: 'medium', label: 'בינוני - איזון בין פעילויות ומנוחה' },
  { value: 'fast', label: 'מהיר - ימים עמוסים, הרבה פעילויות' }
];
