// src/services/destination-service.js

// מידע על יעדים נפוצים
const destinationsData = {
    // יעדים בעברית
    'תל אביב': {
      photos: ['https://source.unsplash.com/800x300/?tel%20aviv,israel'],
      attractions: [
        "טיילת תל אביב", 
        "נמל תל אביב", 
        "מוזיאון תל אביב לאמנות", 
        "שוק הכרמל"
      ],
      breakfasts: [
        "בנדיקט", 
        "קפה נורדוי", 
        "זומן קפה", 
        "לחמים"
      ],
      lunch: [
        "מסעדת כרמלה בנחלה", 
        "פורט סעיד", 
        "דה גורדון ביץ'", 
        "מנטה ריי"
      ],
      dinner: [
        "טאיזו", 
        "הרברט סמואל", 
        "OCD תל אביב", 
        "קיטון"
      ],
      accommodations: [
        "מלון דן תל אביב", 
        "רוטשילד 22", 
        "מלון נורמן", 
        "מלון דיוויד אינטרקונטיננטל"
      ],
      bestTime: "אביב (אפריל-מאי) וסתיו (ספטמבר-נובמבר)",
      language: "עברית, אנגלית",
      currency: "שקל חדש (₪)",
      localTips: "העיר פעילה 24/7, בעיקר באזור שינקין ורוטשילד. רוב המסעדות סגורות בשבת.",
      festivals: [
        { name: "לילה לבן", date: "יוני-יולי", description: "אירועי תרבות ברחבי העיר, חנויות ומוזיאונים פתוחים בלילה" },
        { name: "דוקאביב", date: "מאי", description: "פסטיבל סרטי דוקומנטרי בינלאומי" },
        { name: "מרתון תל אביב", date: "פברואר", description: "מרוץ בינלאומי ברחבי העיר" }
      ]
    },
    'ירושלים': {
      photos: ['https://source.unsplash.com/800x300/?jerusalem,israel'],
      attractions: [
        "הכותל המערבי", 
        "העיר העתיקה", 
        "יד ושם", 
        "שוק מחנה יהודה"
      ],
      breakfasts: [
        "קפה רוזלאך", 
        "מאפיית אנג׳ל", 
        "קפה ארומה", 
        "קפה קפית"
      ],
      lunch: [
        "מחניודה", 
        "פאסטה בסטה", 
        "רכבת החאן", 
        "עזורה"
      ],
      dinner: [
        "מסעדת מול ים", 
        "שף דוד", 
        "אנא לוליק", 
        "מסעדת חצרות העיר"
      ],
      accommodations: [
        "מלון מצודת דוד", 
        "מלון ממילא", 
        "מלון ענבל", 
        "מלון דן פנורמה"
      ],
      bestTime: "אביב (מרץ-מאי) וסתיו (ספטמבר-נובמבר)",
      language: "עברית, אנגלית, ערבית",
      currency: "שקל חדש (₪)",
      localTips: "רוב המוזיאונים חינמיים בימי חמישי אחה״צ. כדאי להצטייד בבקבוק מים בקיץ.",
      festivals: [
        { name: "פסטיבל האור", date: "יוני-יולי", description: "פסטיבל אורות ואמנות בעיר העתיקה" },
        { name: "פסטיבל הבירה", date: "אוגוסט", description: "פסטיבל בירה מקומית עם הופעות חיות" },
        { name: "פסטיבל הקולנוע", date: "יולי", description: "הקרנות סרטים מרחבי העולם" }
      ]
    },
    'חיפה': {
      photos: ['https://source.unsplash.com/800x300/?haifa,israel'],
      attractions: [
        "גני הבהאים", 
        "מוזיאון הכט", 
        "טיילת בת גלים", 
        "מערת אליהו"
      ],
      breakfasts: [
        "קפה לואיז", 
        "פטיסרי לחם ארז", 
        "מנדרין", 
        "גרג קפה"
      ],
      lunch: [
        "פטרה", 
        "שמן זית", 
        "מעיין הבירה", 
        "דוניאנה"
      ],
      dinner: [
        "מסעדת ג'קו", 
        "צ'אנג בה", 
        "ליבנה", 
        "וואהה"
      ],
      accommodations: [
        "מלון בי", 
        "מלון דן כרמל", 
        "מלון גרדן", 
        "מלון קולוני"
      ],
      bestTime: "אביב וסתיו",
      language: "עברית, ערבית, אנגלית",
      currency: "שקל חדש (₪)",
      localTips: "חיפה היא עיר עם מגוון תרבותי. מומלץ להשתמש במטרונית לתחבורה נוחה.",
      festivals: [
        { name: "פסטיבל הסרטים הבינלאומי", date: "ספטמבר-אוקטובר", description: "הקרנות סרטים בינלאומיים" },
        { name: "חג החגים", date: "דצמבר", description: "חגיגות משותפות ליהודים, מוסלמים ונוצרים" },
        { name: "פסטיבל הפסלים", date: "אפריל", description: "תערוכת פסלים ברחבי העיר" }
      ]
    },
    'אילת': {
      photos: ['https://source.unsplash.com/800x300/?eilat,israel'],
      attractions: [
        "שונית האלמוגים", 
        "ריף הדולפינים", 
        "פארק תימנע", 
        "חוף הדקל"
      ],
      breakfasts: [
        "קפה לואיז", 
        "ארומה", 
        "ביגל קפה", 
        "לה פטיסרי"
      ],
      lunch: [
        "קזבלן", 
        "אדי'ס הייד אאוט", 
        "בורדווק", 
        "רניא"
      ],
      dinner: [
        "פדרו", 
        "רק דגים", 
        "המנגליסטה", 
        "הגינה הבהאית"
      ],
      accommodations: [
        "מלון רויאל ביץ'", 
        "מלון הרודס פאלאס", 
        "מלון דן אילת", 
        "מלון ישרוטל ים סוף"
      ],
      bestTime: "אביב וסתיו",
      language: "עברית, אנגלית, רוסית",
      currency: "שקל חדש (₪)",
      localTips: "אילת היא אזור סחר חופשי - קניות ללא מע\"מ. מומלץ להצטייד במסנן קרינה ומים לטיולים.",
      festivals: [
        { name: "פסטיבל ג'אז בים האדום", date: "אוגוסט", description: "מופעי ג'אז על חוף הים" },
        { name: "אילת אילון", date: "פברואר", description: "כנס מוזיקלי קלאסי" },
        { name: "תחרות הטריאתלון", date: "אפריל", description: "תחרות טריאתלון בינלאומית" }
      ]
    },
  
    // יעדים באנגלית
    'Paris': {
      photos: ['https://source.unsplash.com/800x300/?paris,france'],
      attractions: [
        "מגדל אייפל", 
        "מוזיאון הלובר", 
        "קתדרלת נוטרדאם", 
        "שאנז אליזה"
      ],
      breakfasts: [
        "Ladurée", 
        "Angelina", 
        "La Coupole", 
        "Le Petit Zinc"
      ],
      lunch: [
        "Chez Janou", 
        "Le Comptoir du Relais", 
        "Le Relais de l'Entrecôte", 
        "L'As du Fallafel"
      ],
      dinner: [
        "L'Atelier de Joël Robuchon", 
        "Le Jules Verne", 
        "Septime", 
        "Frenchie"
      ],
      accommodations: [
        "מלון ריץ פריז", 
        "פארק חיות", 
        "הוטל קוסטס", 
        "מלון קריון"
      ],
      bestTime: "אביב (אפריל-יוני) וסתיו (ספטמבר-אוקטובר)",
      language: "צרפתית, אנגלית במקומות תיירות",
      currency: "אירו (€)",
      localTips: "התחבורה הציבורית בפריז מצוינת. כדאי לרכוש כרטיסיות למטרו.",
      festivals: [
        { name: "פסטיבל הג'אז בפריז", date: "יוני-יולי", description: "פסטיבל מוזיקת ג'אז מהגדולים באירופה" },
        { name: "יום הבסטיליה", date: "14 ביולי", description: "חגיגות יום העצמאות הצרפתי עם זיקוקים מרהיבים" },
        { name: "נשף לבן", date: "יוני", description: "ארוחת ערב המונית בלבוש לבן במקום פומבי" }
      ]
    },
    'פריז': {
      photos: ['https://source.unsplash.com/800x300/?paris,france'],
      attractions: [
        "מגדל אייפל", 
        "מוזיאון הלובר", 
        "קתדרלת נוטרדאם", 
        "שאנז אליזה"
      ],
      breakfasts: [
        "Ladurée", 
        "Angelina", 
        "La Coupole", 
        "Le Petit Zinc"
      ],
      lunch: [
        "Chez Janou", 
        "Le Comptoir du Relais", 
        "Le Relais de l'Entrecôte", 
        "L'As du Fallafel"
      ],
      dinner: [
        "L'Atelier de Joël Robuchon", 
        "Le Jules Verne", 
        "Septime", 
        "Frenchie"
      ],
      accommodations: [
        "מלון ריץ פריז", 
        "פארק חיות", 
        "הוטל קוסטס", 
        "מלון קריון"
      ],
      bestTime: "אביב (אפריל-יוני) וסתיו (ספטמבר-אוקטובר)",
      language: "צרפתית, אנגלית במקומות תיירות",
      currency: "אירו (€)",
      localTips: "התחבורה הציבורית בפריז מצוינת. כדאי לרכוש כרטיסיות למטרו.",
      festivals: [
        { name: "פסטיבל הג'אז בפריז", date: "יוני-יולי", description: "פסטיבל מוזיקת ג'אז מהגדולים באירופה" },
        { name: "יום הבסטיליה", date: "14 ביולי", description: "חגיגות יום העצמאות הצרפתי עם זיקוקים מרהיבים" },
        { name: "נשף לבן", date: "יוני", description: "ארוחת ערב המונית בלבוש לבן במקום פומבי" }
      ]
    },
    'London': {
      photos: ['https://source.unsplash.com/800x300/?london,uk'],
      attractions: [
        "ארמון בקינגהאם", 
        "ביג בן", 
        "מוזיאון בריטי", 
        "לונדון איי"
      ],
      breakfasts: [
        "The Breakfast Club", 
        "Dishoom", 
        "The Wolseley", 
        "Caravan"
      ],
      lunch: [
        "Borough Market", 
        "Ottolenghi", 
        "The Ivy", 
        "Sketch"
      ],
      dinner: [
        "Gordon Ramsay Restaurant", 
        "The Ledbury", 
        "The Clove Club", 
        "Dinner by Heston Blumenthal"
      ],
      accommodations: [
        "מלון סבוי", 
        "מלון דורצ'סטר", 
        "שנגרי-לה לונדון", 
        "מלון סוהו"
      ],
      bestTime: "אביב וקיץ (מאי-ספטמבר)",
      language: "אנגלית",
      currency: "ליש\"ט (£)",
      localTips: "הכרטיס האוסטר משתלם מאוד לתחבורה ציבורית. במוזיאונים העיקריים הכניסה חינם.",
      festivals: [
        { name: "קרנבל נוטינג היל", date: "סוף אוגוסט", description: "קרנבל רחוב ענק, הגדול באירופה" },
        { name: "וימבלדון", date: "יולי", description: "טורניר הטניס היוקרתי" },
        { name: "פסטיבל לונדון", date: "יוני-יולי", description: "פסטיבל אמנות ותרבות" }
      ]
    },
    'לונדון': {
      photos: ['https://source.unsplash.com/800x300/?london,uk'],
      attractions: [
        "ארמון בקינגהאם", 
        "ביג בן", 
        "מוזיאון בריטי", 
        "לונדון איי"
      ],
      breakfasts: [
        "The Breakfast Club", 
        "Dishoom", 
        "The Wolseley", 
        "Caravan"
      ],
      lunch: [
        "Borough Market", 
        "Ottolenghi", 
        "The Ivy", 
        "Sketch"
      ],
      dinner: [
        "Gordon Ramsay Restaurant", 
        "The Ledbury", 
        "The Clove Club", 
        "Dinner by Heston Blumenthal"
      ],
      accommodations: [
        "מלון סבוי", 
        "מלון דורצ'סטר", 
        "שנגרי-לה לונדון", 
        "מלון סוהו"
      ],
      bestTime: "אביב וקיץ (מאי-ספטמבר)",
      language: "אנגלית",
      currency: "ליש\"ט (£)",
      localTips: "הכרטיס האוסטר משתלם מאוד לתחבורה ציבורית. במוזיאונים העיקריים הכניסה חינם.",
      festivals: [
        { name: "קרנבל נוטינג היל", date: "סוף אוגוסט", description: "קרנבל רחוב ענק, הגדול באירופה" },
        { name: "וימבלדון", date: "יולי", description: "טורניר הטניס היוקרתי" },
        { name: "פסטיבל לונדון", date: "יוני-יולי", description: "פסטיבל אמנות ותרבות" }
      ]
    },
    'New York': {
      photos: ['https://source.unsplash.com/800x300/?new%20york,usa'],
      attractions: [
        "פסל החירות", 
        "סנטרל פארק", 
        "אמפייר סטייט בילדינג", 
        "טיימס סקוור"
      ],
      breakfasts: [
        "Russ & Daughters", 
        "Clinton St. Baking Company", 
        "Balthazar", 
        "Ess-a-Bagel"
      ],
      lunch: [
        "Katz's Delicatessen", 
        "Shake Shack", 
        "The Halal Guys", 
        "Xi'an Famous Foods"
      ],
      dinner: [
        "Le Bernardin", 
        "Eleven Madison Park", 
        "Peter Luger Steak House", 
        "Gramercy Tavern"
      ],
      accommodations: [
        "מלון פלאזה", 
        "פארק חיות", 
        "האדסון", 
        "מלון סטנדרט"
      ],
      bestTime: "אביב (אפריל-יוני) וסתיו (ספטמבר-נובמבר)",
      language: "אנגלית, ספרדית",
      currency: "דולר אמריקאי ($)",
      localTips: "התחבורה הנוחה ביותר היא המטרו. כדאי לרכוש כרטיס MetroCard. תן טיפ של 15-20% במסעדות.",
      festivals: [
        { name: "מצעד יום העצמאות", date: "4 ביולי", description: "מצעד ענק וזיקוקים" },
        { name: "מצעד מאסי", date: "יום חג ההודיה", description: "מצעד בלונים ענק" },
        { name: "פסטיבל הסרטים של טרייבקה", date: "אפריל-מאי", description: "פסטיבל סרטים יוקרתי" }
      ]
    },
    'ניו יורק': {
      photos: ['https://source.unsplash.com/800x300/?new%20york,usa'],
      attractions: [
        "פסל החירות", 
        "סנטרל פארק", 
        "אמפייר סטייט בילדינג", 
        "טיימס סקוור"
      ],
      breakfasts: [
        "Russ & Daughters", 
        "Clinton St. Baking Company", 
        "Balthazar", 
        "Ess-a-Bagel"
      ],
      lunch: [
        "Katz's Delicatessen", 
        "Shake Shack", 
        "The Halal Guys", 
        "Xi'an Famous Foods"
      ],
      dinner: [
        "Le Bernardin", 
        "Eleven Madison Park", 
        "Peter Luger Steak House", 
        "Gramercy Tavern"
      ],
      accommodations: [
        "מלון פלאזה", 
        "פארק חיות", 
        "האדסון", 
        "מלון סטנדרט"
      ],
      bestTime: "אביב (אפריל-יוני) וסתיו (ספטמבר-נובמבר)",
      language: "אנגלית, ספרדית",
      currency: "דולר אמריקאי ($)",
      localTips: "התחבורה הנוחה ביותר היא המטרו. כדאי לרכוש כרטיס MetroCard. תן טיפ של 15-20% במסעדות.",
      festivals: [
        { name: "מצעד יום העצמאות", date: "4 ביולי", description: "מצעד ענק וזיקוקים" },
        { name: "מצעד מאסי", date: "יום חג ההודיה", description: "מצעד בלונים ענק" },
        { name: "פסטיבל הסרטים של טרייבקה", date: "אפריל-מאי", description: "פסטיבל סרטים יוקרתי" }
      ]
    },
    'San Francisco': {
      photos: ['https://source.unsplash.com/800x300/?san%20francisco,usa'],
      attractions: [
        "גשר שער הזהב", 
        "אלקטרז", 
        "רחוב לומברד", 
        "פישרמנס וורף"
      ],
      breakfasts: [
        "Tartine Bakery", 
        "Plow", 
        "Mama's on Washington Square", 
        "Brenda's French Soul Food"
      ],
      lunch: [
        "Ferry Building Marketplace", 
        "La Taqueria", 
        "Swan Oyster Depot", 
        "Bi-Rite Market"
      ],
      dinner: [
        "State Bird Provisions", 
        "Quince", 
        "Acquerello", 
        "Benu"
      ],
      accommodations: [
        "פאלאס הוטל", 
        "פרמונט", 
        "פארק חיות", 
        "מלון ויטאל"
      ],
      bestTime: "ספטמבר-נובמבר (סתיו)",
      language: "אנגלית, ספרדית",
      currency: "דולר אמריקאי ($)",
      localTips: "סן פרנסיסקו קרירה גם בקיץ, קח איתך שכבות חמות. הקרטים (רכבלים) הם אטרקציה תיירותית פופולרית.",
      festivals: [
        { name: "פסטיבל אאוטסייד לנדס", date: "אוגוסט", description: "פסטיבל מוזיקה בפארק גולדן גייט" },
        { name: "מצעד הגאווה", date: "יוני", description: "אחד ממצעדי הגאווה הגדולים בעולם" },
        { name: "פסטיבל היין של סונומה", date: "יוני", description: "פסטיבל יין באזור עמק סונומה" }
      ]
    },
    'סאן פרנסיסקו': {
      photos: ['https://source.unsplash.com/800x300/?san%20francisco,usa'],
      attractions: [
        "גשר שער הזהב", 
        "אלקטרז", 
        "רחוב לומברד", 
        "פישרמנס וורף"
      ],
      breakfasts: [
        "Tartine Bakery", 
        "Plow", 
        "Mama's on Washington Square", 
        "Brenda's French Soul Food"
      ],
      lunch: [
        "Ferry Building Marketplace", 
        "La Taqueria", 
        "Swan Oyster Depot", 
        "Bi-Rite Market"
      ],
      dinner: [
        "State Bird Provisions", 
        "Quince", 
        "Acquerello", 
        "Benu"
      ],
      accommodations: [
        "פאלאס הוטל", 
        "פרמונט", 
        "פארק חיות", 
        "מלון ויטאל"
      ],
      bestTime: "ספטמבר-נובמבר (סתיו)",
      language: "אנגלית, ספרדית",
      currency: "דולר אמריקאי ($)",
      localTips: "סן פרנסיסקו קרירה גם בקיץ, קח איתך שכבות חמות. הקרטים (רכבלים) הם אטרקציה תיירותית פופולרית.",
      festivals: [
        { name: "פסטיבל אאוטסייד לנדס", date: "אוגוסט", description: "פסטיבל מוזיקה בפארק גולדן גייט" },
        { name: "מצעד הגאווה", date: "יוני", description: "אחד ממצעדי הגאווה הגדולים בעולם" },
        { name: "פסטיבל היין של סונומה", date: "יוני", description: "פסטיבל יין באזור עמק סונומה" }
      ]
    },
    'Los Angeles': {
      photos: ['https://source.unsplash.com/800x300/?los%20angeles,usa'],
      attractions: [
        "הוליווד", 
        "שדרת הכוכבים", 
        "יוניברסל סטודיוס", 
        "חופי סנטה מוניקה"
      ],
      breakfasts: [
        "Sqirl", 
        "Gjusta", 
        "République", 
        "Grand Central Market"
      ],
      lunch: [
        "In-N-Out Burger", 
        "Guisados", 
        "Langer's Deli", 
        "Grand Central Market"
      ],
      dinner: [
        "Providence", 
        "n/naka", 
        "Bestia", 
        "Spago Beverly Hills"
      ],
      accommodations: [
        "בוורלי הילס", 
        "מלון שאטו מרמונט", 
        "ההוליווד רוזוולט", 
        "מלון לונדון ווסט הוליווד"
      ],
      bestTime: "אביב (מרץ-מאי) וסתיו (ספטמבר-נובמבר)",
      language: "אנגלית, ספרדית",
      currency: "דולר אמריקאי ($)",
      localTips: "רכב הוא הכרחי בלוס אנג'לס. התנועה עמוסה בשעות הבוקר (7-9) ואחר הצהריים (4-7).",
      festivals: [
        { name: "טקס האוסקר", date: "פברואר-מרץ", description: "טקס פרסי האקדמיה האמריקאית לקולנוע" },
        { name: "פסטיבל הסרטים של לוס אנג'לס", date: "יוני", description: "פסטיבל סרטים בינלאומי" },
        { name: "תהלוכת רוזס", date: "1 בינואר", description: "מצעד פרחים בפסדינה" }
      ]
    },
   'לוס אנגלס': {
    photos: ['https://source.unsplash.com/800x300/?los%20angeles,usa'],
    attractions: [
      "הוליווד", 
      "שדרת הכוכבים", 
      "יוניברסל סטודיוס", 
      "חופי סנטה מוניקה"
    ],
    breakfasts: [
      "Sqirl", 
      "Gjusta", 
      "République", 
      "Grand Central Market"
    ],
    lunch: [
      "In-N-Out Burger",
      "Guisados", 
      "Langer's Deli", 
      "Grand Central Market"
    ],
    dinner: [
      "Providence", 
      "n/naka", 
      "Bestia", 
      "Spago Beverly Hills"
    ],
    accommodations: [
      "בוורלי הילס", 
      "מלון שאטו מרמונט", 
      "ההוליווד רוזוולט", 
      "מלון לונדון ווסט הוליווד"
    ],
    bestTime: "אביב (מרץ-מאי) וסתיו (ספטמבר-נובמבר)",
    language: "אנגלית, ספרדית",
    currency: "דולר אמריקאי ($)",
    localTips: "רכב הוא הכרחי בלוס אנג'לס. התנועה עמוסה בשעות הבוקר (7-9) ואחר הצהריים (4-7).",
    festivals: [
      { name: "טקס האוסקר", date: "פברואר-מרץ", description: "טקס פרסי האקדמיה האמריקאית לקולנוע" },
      { name: "פסטיבל הסרטים של לוס אנג'לס", date: "יוני", description: "פסטיבל סרטים בינלאומי" },
      { name: "תהלוכת רוזס", date: "1 בינואר", description: "מצעד פרחים בפסדינה" }
    ]
  },
  'San Diego': {
    photos: ['https://source.unsplash.com/800x300/?san%20diego,usa'],
    attractions: [
      "גן החיות של סן דייגו", 
      "פארק בלבואה", 
      "סיסייד וילג'", 
      "חופי לה חויה"
    ],
    breakfasts: [
      "Hash House A Go Go", 
      "Snooze, an A.M. Eatery", 
      "Great Maple", 
      "Breakfast Republic"
    ],
    lunch: [
      "Phil's BBQ", 
      "Oscars Mexican Seafood", 
      "The Fish Market", 
      "Mister A's"
    ],
    dinner: [
      "Born & Raised", 
      "Addison", 
      "Market Restaurant + Bar", 
      "Nine-Ten"
    ],
    accommodations: [
      "מלון דל קורונדו", 
      "לה ולנסיה", 
      "פנדרי לה חויה", 
      "מלון פאלומר"
    ],
    bestTime: "מרץ-מאי וספטמבר-נובמבר",
    language: "אנגלית, ספרדית",
    currency: "דולר אמריקאי ($)",
    localTips: "האקלים בסן דייגו נוח כל השנה. בקיץ יש תופעה של 'ערפל ים' בבקרים.",
    festivals: [
      { name: "קומיק-קון", date: "יולי", description: "כנס הקומיקס הגדול בעולם" },
      { name: "פסטיבל הבירה של סן דייגו", date: "נובמבר", description: "פסטיבל בירה עם למעלה מ-100 מבשלות" },
      { name: "פסטיבל הסרטים של סן דייגו", date: "אוקטובר", description: "פסטיבל סרטים בינלאומי" }
    ]
  },
  'סאן דיאגו': {
    photos: ['https://source.unsplash.com/800x300/?san%20diego,usa'],
    attractions: [
      "גן החיות של סן דייגו", 
      "פארק בלבואה", 
      "סיסייד וילג'", 
      "חופי לה חויה"
    ],
    breakfasts: [
      "Hash House A Go Go", 
      "Snooze, an A.M. Eatery", 
      "Great Maple", 
      "Breakfast Republic"
    ],
    lunch: [
      "Phil's BBQ", 
      "Oscars Mexican Seafood", 
      "The Fish Market", 
      "Mister A's"
    ],
    dinner: [
      "Born & Raised", 
      "Addison", 
      "Market Restaurant + Bar", 
      "Nine-Ten"
    ],
    accommodations: [
      "מלון דל קורונדו", 
      "לה ולנסיה", 
      "פנדרי לה חויה", 
      "מלון פאלומר"
    ],
    bestTime: "מרץ-מאי וספטמבר-נובמבר",
    language: "אנגלית, ספרדית",
    currency: "דולר אמריקאי ($)",
    localTips: "האקלים בסן דייגו נוח כל השנה. בקיץ יש תופעה של 'ערפל ים' בבקרים.",
    festivals: [
      { name: "קומיק-קון", date: "יולי", description: "כנס הקומיקס הגדול בעולם" },
      { name: "פסטיבל הבירה של סן דייגו", date: "נובמבר", description: "פסטיבל בירה עם למעלה מ-100 מבשלות" },
      { name: "פסטיבל הסרטים של סן דייגו", date: "אוקטובר", description: "פסטיבל סרטים בינלאומי" }
    ]
  },
  'סן דיאגו': {
    photos: ['https://source.unsplash.com/800x300/?san%20diego,usa'],
    attractions: [
      "גן החיות של סן דייגו", 
      "פארק בלבואה", 
      "סיסייד וילג'", 
      "חופי לה חויה"
    ],
    breakfasts: [
      "Hash House A Go Go", 
      "Snooze, an A.M. Eatery", 
      "Great Maple", 
      "Breakfast Republic"
    ],
    lunch: [
      "Phil's BBQ", 
      "Oscars Mexican Seafood", 
      "The Fish Market", 
      "Mister A's"
    ],
    dinner: [
      "Born & Raised", 
      "Addison", 
      "Market Restaurant + Bar", 
      "Nine-Ten"
    ],
    accommodations: [
      "מלון דל קורונדו", 
      "לה ולנסיה", 
      "פנדרי לה חויה", 
      "מלון פאלומר"
    ],
    bestTime: "מרץ-מאי וספטמבר-נובמבר",
    language: "אנגלית, ספרדית",
    currency: "דולר אמריקאי ($)",
    localTips: "האקלים בסן דייגו נוח כל השנה. בקיץ יש תופעה של 'ערפל ים' בבקרים.",
    festivals: [
      { name: "קומיק-קון", date: "יולי", description: "כנס הקומיקס הגדול בעולם" },
      { name: "פסטיבל הבירה של סן דייגו", date: "נובמבר", description: "פסטיבל בירה עם למעלה מ-100 מבשלות" },
      { name: "פסטיבל הסרטים של סן דייגו", date: "אוקטובר", description: "פסטיבל סרטים בינלאומי" }
    ]
  },
  'Seattle': {
    photos: ['https://source.unsplash.com/800x300/?seattle,usa'],
    attractions: [
      "ספייס ניידל", 
      "פייק פלייס מרקט", 
      "פארק דיסקברי", 
      "מוזיאון פופ קלצ'ר"
    ],
    breakfasts: [
      "Portage Bay Cafe", 
      "The Crumpet Shop", 
      "Biscuit Bitch", 
      "Toulouse Petit"
    ],
    lunch: [
      "Pike Place Chowder", 
      "Salumi", 
      "Serious Pie", 
      "Paseo"
    ],
    dinner: [
      "Canlis", 
      "The Walrus and the Carpenter", 
      "Altura", 
      "Spinasse"
    ],
    accommodations: [
      "פור סיזנס סיאטל", 
      "מלון תומפסון", 
      "מלון אדג'ווטר", 
      "מלון אלקסיס"
    ],
    bestTime: "יוני-ספטמבר",
    language: "אנגלית",
    currency: "דולר אמריקאי ($)",
    localTips: "סיאטל ידועה בגשמים, אז הצטייד במטריה. במקום להשכיר רכב, נסה את התחבורה הציבורית היעילה.",
    festivals: [
      { name: "סיאטל פריידיי", date: "יוני", description: "פסטיבל אמנות ומוזיקה" },
      { name: "Bumbershoot", date: "יום העבודה (ספטמבר)", description: "פסטיבל מוזיקה ואמנות" },
      { name: "פסטיבל הסרטים של סיאטל", date: "מאי-יוני", description: "פסטיבל סרטים בינלאומי" }
    ]
  },
  'סיאטל': {
    photos: ['https://source.unsplash.com/800x300/?seattle,usa'],
    attractions: [
      "ספייס ניידל", 
      "פייק פלייס מרקט", 
      "פארק דיסקברי", 
      "מוזיאון פופ קלצ'ר"
    ],
    breakfasts: [
      "Portage Bay Cafe", 
      "The Crumpet Shop", 
      "Biscuit Bitch", 
      "Toulouse Petit"
    ],
    lunch: [
      "Pike Place Chowder", 
      "Salumi", 
      "Serious Pie", 
      "Paseo"
    ],
    dinner: [
      "Canlis", 
      "The Walrus and the Carpenter", 
      "Altura", 
      "Spinasse"
    ],
    accommodations: [
      "פור סיזנס סיאטל", 
      "מלון תומפסון", 
      "מלון אדג'ווטר", 
      "מלון אלקסיס"
    ],
    bestTime: "יוני-ספטמבר",
    language: "אנגלית",
    currency: "דולר אמריקאי ($)",
    localTips: "סיאטל ידועה בגשמים, אז הצטייד במטריה. במקום להשכיר רכב, נסה את התחבורה הציבורית היעילה.",
    festivals: [
      { name: "סיאטל פריידיי", date: "יוני", description: "פסטיבל אמנות ומוזיקה" },
      { name: "Bumbershoot", date: "יום העבודה (ספטמבר)", description: "פסטיבל מוזיקה ואמנות" },
      { name: "פסטיבל הסרטים של סיאטל", date: "מאי-יוני", description: "פסטיבל סרטים בינלאומי" }
    ]
  }
};

// תבנית למידע ברירת מחדל על יעד
const defaultDestinationData = {
  photos: ['https://source.unsplash.com/800x300/?travel'],
  attractions: [
    "אתר תיירות מרכזי", 
    "פארק עירוני", 
    "מוזיאון מקומי", 
    "אזור קניות"
  ],
  breakfasts: [
    "בית קפה מקומי", 
    "מאפייה", 
    "מסעדת בוקר", 
    "בופה במלון"
  ],
  lunch: [
    "מסעדה מקומית", 
    "שוק אוכל", 
    "מסעדת שף", 
    "מסעדה אתנית"
  ],
  dinner: [
    "מסעדה יוקרתית", 
    "מסעדה מסורתית", 
    "מסעדת שף", 
    "מסעדת דגים"
  ],
  accommodations: [
    "מלון בוטיק", 
    "מלון עסקים", 
    "מלון יוקרה", 
    "דירת Airbnb"
  ],
  bestTime: "אביב וסתיו",
  language: "התייעץ במידע מקומי",
  currency: "התייעץ במידע מקומי",
  localTips: "מומלץ לבדוק אטרקציות מקומיות ולהתייעץ בתושבים מקומיים.",
  festivals: [
    { name: "פסטיבל מקומי", date: "בדוק תאריכים מדויקים", description: "פסטיבל תרבות מקומי" },
    { name: "חגיגות מסורתיות", date: "תלוי בעונה", description: "אירועי תרבות מקומיים" },
    { name: "פסטיבל אוכל", date: "בדוק תאריכים מדויקים", description: "חגיגת קולינריה מקומית" }
  ]
};

/**
 * מייצר מידע על יעד
 * @param {string} location - שם היעד
 * @returns {Object} מידע על היעד
 */
export const getDestinationInfo = async (location) => {
  // נסה למצוא את היעד במאגר המידע
  let destInfo = destinationsData[location];
  
  // אם לא נמצא, בדוק גם את המיפוי האנגלי/עברי
  if (!destInfo) {
    // מיפוי בסיסי עברית-אנגלית
    const locationMapping = {
      'תל אביב': 'Tel Aviv',
      'ירושלים': 'Jerusalem',
      'חיפה': 'Haifa',
      'אילת': 'Eilat',
      'פריז': 'Paris',
      'לונדון': 'London',
      'ניו יורק': 'New York',
      'סן פרנסיסקו': 'San Francisco',
      'סאן פרנסיסקו': 'San Francisco',
      'לוס אנג\'לס': 'Los Angeles',
      'לוס אנגלס': 'Los Angeles',
      'סן דיאגו': 'San Diego',
      'סאן דיאגו': 'San Diego',
      'סיאטל': 'Seattle'
    };
    
    // בדוק אם יש מיפוי לשם המקום
    const mappedLocation = locationMapping[location];
    if (mappedLocation) {
      destInfo = destinationsData[mappedLocation];
    }
    
    // בדוק גם הפוך - אם חיפשו באנגלית ויש מידע בעברית
    if (!destInfo) {
      // הפוך את המיפוי
      const reverseMapping = {};
      Object.keys(locationMapping).forEach(key => {
        reverseMapping[locationMapping[key]] = key;
      });
      
      const hebrewLocation = reverseMapping[location];
      if (hebrewLocation) {
        destInfo = destinationsData[hebrewLocation];
      }
    }
  }
  
  // אם עדיין לא נמצא, השתמש במידע כללי ברירת מחדל
  if (!destInfo) {
    console.log(`לא נמצא מידע מפורט עבור: ${location}, משתמש בתבנית כללית`);
    
    // העתק את התבנית הכללית
    destInfo = JSON.parse(JSON.stringify(defaultDestinationData));
    
    // התאם את התמונה ליעד
    destInfo.photos = [`https://source.unsplash.com/800x300/?${encodeURIComponent(location)}`];
  }
  
  // החזר את המידע
  return destInfo;
};
// הוסף את זה לקובץ ה-API הקיים שלך
