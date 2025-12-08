"use client"

import { useEffect } from "react"
import { I18nextProvider } from "react-i18next"
import { i18n } from "@/lib/i18n"

/**
 * I18n Provider - Wraps the app with i18next context
 * This ensures translations are available throughout the app
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Sync i18next with localStorage language preference
    const storedLang = localStorage.getItem('preferred_language')
    if (storedLang && i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang)
    }

    // Listen for language changes from LanguageSelector
    const handleLanguageChange = (event: CustomEvent) => {
      const lang = event.detail?.lang
      if (lang && i18n.language !== lang) {
        i18n.changeLanguage(lang)
      }
    }

    window.addEventListener('languageChanged', handleLanguageChange as EventListener)

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

