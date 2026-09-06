import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/index';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(
    localStorage.getItem('appLanguage') || 'he'
  );

  const changeLanguage = useCallback((code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('appLanguage', code);
    setLanguage(code);
  }, [i18n]);

  // ── הכיוון נגזר מהשפה, ולא מוחל בהחלפה בלבד ──
  // עד 06.09.2026 `dir` ו-`lang` נכתבו רק בתוך `changeLanguage`.
  // בטעינת דף השפה נקראת מ-localStorage אל ה-state, אבל תופעת
  // הלוואי אינה מושמעת מחדש — ולכן משתמש שבחר צרפתית וחזר קיבל
  // ממשק צרפתי עם `lang="he"` ופריסת ימין-לשמאל. נמדד: הנקודה
  // בסוף המשפט הופיעה בתחילתו, וקורא מסך הוכרז כעברית.
  //
  // כ-`useEffect` על `language` זה חל בשני המסלולים מאותו מקור,
  // ואין שתי נקודות שיכולות לסטות זו מזו.
  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.code === language);
    document.documentElement.dir = lang?.dir || 'rtl';
    document.documentElement.lang = language;
  }, [language]);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, currentLang, changeLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
