import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import he from './locales/he.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const LANGUAGES = [
  { code: 'he', label: 'עברית',    dir: 'rtl', flag: '🇮🇱' },
  { code: 'en', label: 'English',  dir: 'ltr', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', dir: 'ltr', flag: '🇫🇷' },
  { code: 'es', label: 'Español',  dir: 'ltr', flag: '🇪🇸' },
  { code: 'pt', label: 'Português',dir: 'ltr', flag: '🇧🇷' },
];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: he },
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es },
      pt: { translation: pt },
    },
    lng: localStorage.getItem('appLanguage') || 'he',
    fallbackLng: 'he',
    interpolation: { escapeValue: false },
  });

export default i18n;
