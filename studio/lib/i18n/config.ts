import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files - Recommended SaaS language set
import enTranslations from '../locales/en/common.json'
import esTranslations from '../locales/es/common.json'
import frTranslations from '../locales/fr/common.json'
import deTranslations from '../locales/de/common.json'
import itTranslations from '../locales/it/common.json'
import ptTranslations from '../locales/pt/common.json'
import ruTranslations from '../locales/ru/common.json'
import svTranslations from '../locales/sv/common.json'
import noTranslations from '../locales/no/common.json'
import daTranslations from '../locales/da/common.json'
import zhTranslations from '../locales/zh/common.json'
import jaTranslations from '../locales/ja/common.json'
import koTranslations from '../locales/ko/common.json'
import hiTranslations from '../locales/hi/common.json'
import arTranslations from '../locales/ar/common.json'
import heTranslations from '../locales/he/common.json'

const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  it: { translation: itTranslations },
  pt: { translation: ptTranslations },
  ru: { translation: ruTranslations },
  sv: { translation: svTranslations },
  no: { translation: noTranslations },
  da: { translation: daTranslations },
  zh: { translation: zhTranslations },
  ja: { translation: jaTranslations },
  ko: { translation: koTranslations },
  hi: { translation: hiTranslations },
  ar: { translation: arTranslations },
  he: { translation: heTranslations },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: typeof window === 'undefined' ? 'en' : undefined, // Force 'en' during SSR
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: 'preferred_language',
      // Cache user language
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  })

export default i18n

