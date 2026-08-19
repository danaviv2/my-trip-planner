const webpack = require('webpack');

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
          'process.env.REACT_APP_BUILD_TIME': JSON.stringify(new Date().toISOString()),
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
