import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import ml from './locales/ml.json';

// Supported languages — no country flags, use native scripts
export const LANGUAGES = [
  { code: 'en', label: 'English',  nativeLabel: 'English'  },
  { code: 'te', label: 'Telugu',   nativeLabel: 'తెలుగు'    },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'हिन्दी'     },
  { code: 'ta', label: 'Tamil',    nativeLabel: 'தமிழ்'     },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം'   },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      te: { translation: te },
      hi: { translation: hi },
      ta: { translation: ta },
      ml: { translation: ml },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'idms-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
