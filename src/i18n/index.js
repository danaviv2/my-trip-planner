import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import he from './locales/he.json';
import en from './locales/en.json';

export const LANGUAGES = [
  { code: 'he', label: 'עברית', dir: 'rtl', flag: '🇮🇱' },
  { code: 'en', label: 'English', dir: 'ltr', flag: '🇺🇸' },
];

i18n
  .use(initReactI18next)
  .init({
    resources: { he: { translation: he }, en: { translation: en } },
    lng: localStorage.getItem('appLanguage') || 'he',
    fallbackLng: 'he',
    interpolation: { escapeValue: false },
  });

export default i18n;
