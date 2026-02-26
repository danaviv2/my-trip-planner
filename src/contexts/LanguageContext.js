import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

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
    // עדכון כיוון HTML
    const lang = LANGUAGES.find((l) => l.code === code);
    document.documentElement.dir = lang?.dir || 'rtl';
    document.documentElement.lang = code;
  }, [i18n]);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, currentLang, changeLanguage, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
