"use client"

import { useEffect } from "react"

/**
 * Language Provider - Sets HTML lang and dir attributes based on user preference
 * Supports: en, es, fr, de, pt, zh, ja, hi, ar (with RTL support for Arabic)
 */
export function LanguageProvider() {
  useEffect(() => {
    // RTL languages
    const RTL_LANGUAGES = ['ar', 'he']
    
    // Get language preference from localStorage or browser
    const getLanguage = () => {
      if (typeof window === 'undefined') return 'en'
      
      // Check localStorage first
      const stored = localStorage.getItem('preferred_language')
      if (stored) return stored
      
      // Fall back to browser language
      const browserLang = navigator.language || navigator.languages?.[0] || 'en'
      // Extract language code (e.g., 'en-US' -> 'en')
      return browserLang.split('-')[0]
    }

    const updateLanguage = () => {
      const lang = getLanguage()
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang
        // Set direction for RTL languages
        document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr'
      }
    }

    // Initial language setup
    updateLanguage()
    
    // Listen for language changes from LanguageSelector
    const handleLanguageChange = (event: CustomEvent) => {
      const lang = event.detail?.lang || getLanguage()
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang
        document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr'
      }
    }

    window.addEventListener('languageChanged', handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
    }
  }, [])

  return null
}

