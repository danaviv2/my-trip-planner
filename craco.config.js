const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

/**
 * חותמת אחת לשני היעדים.
 *
 * הקוד נושא אותה בפנים, וקובץ version.json מגיש אותה מהשרת. שתי חותמות
 * שנוצרות בנפרד היו נבדלות זו מזו בכל בנייה, והבדיקה הייתה מדווחת על
 * "גרסה חדשה" לנצח.
 */
const BUILD_TIME = new Date().toISOString();

// נכתב אל public כדי שייכנס לתיקיית הבנייה כפי שהוא, בלי צינור נוסף.
try {
  fs.writeFileSync(
    path.join(__dirname, 'public', 'version.json'),
    JSON.stringify({ buildTime: BUILD_TIME }) + '\n'
  );
} catch (err) {
  // כתיבה שנכשלת בשקט משאירה חותמת ישנה על השרת מול חדשה בקוד, כלומר
  // "יש גרסה חדשה" לנצח — או ההפך, ולעולם לא. שני הכיוונים נראים
  // כמו תקלה באפליקציה ולא ככשל של שלב הבנייה, ולכן הוא נאמר.
  console.error('[craco] כתיבת public/version.json נכשלה:', err.message);
}

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // חותמת בנייה גלויה במסך.
      //
      // סבב שלם של "תיקנתי / לא רואה שינוי" נבע מכך שאיש מאיתנו לא ידע
      // איזו גרסה רצה בדפדפן בפועל. חותמת שמוצגת למשתמש מסיימת את
      // הניחוש: אפשר לומר בוודאות אם התיקון כבר שם.
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          'process.env.REACT_APP_BUILD_TIME': JSON.stringify(BUILD_TIME),
        })
      );

      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
      return webpackConfig;
    },
  },
};
