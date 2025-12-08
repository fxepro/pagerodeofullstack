"use client"

import { useEffect, useState } from "react"
import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Recommended SaaS language set for PageRodeo
const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', rtl: false },
  { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', rtl: false },
  { code: 'no', name: 'Norsk', flag: '🇳🇴', rtl: false },
  { code: 'da', name: 'Dansk', flag: '🇩🇰', rtl: false },
  { code: 'zh', name: '中文 (简体)', flag: '🇨🇳', rtl: false },
  { code: 'ja', name: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'he', name: 'עברית', flag: '🇮🇱', rtl: true },
] as const

export function LanguageSelector() {
  const { i18n } = useTranslation()
  // Initialize with default 'en' to avoid hydration mismatch
  const [currentLang, setCurrentLang] = useState<string>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted (client-side only)
    setMounted(true)
    
    // Read from localStorage or use i18next language
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('preferred_language')
      const lang = storedLang || i18n.language || 'en'
      setCurrentLang(lang)
      
      // Sync i18next if needed
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang)
      }
      
      // Update HTML lang attribute
      document.documentElement.lang = lang
      
      // Set RTL direction
      const selectedLang = LANGUAGES.find(l => l.code === lang)
      if (selectedLang?.rtl) {
        document.documentElement.dir = 'rtl'
      } else {
        document.documentElement.dir = 'ltr'
      }
    }
  }, []) // Only run once on mount

  useEffect(() => {
    // Sync with i18next language changes (from other sources)
    if (mounted && i18n.language && i18n.language !== currentLang) {
      setCurrentLang(i18n.language)
    }
  }, [i18n.language, mounted, currentLang])

  const handleLanguageChange = (langCode: string) => {
    setCurrentLang(langCode)
    
    // Change i18next language
    i18n.changeLanguage(langCode)
    
    // Update localStorage
    localStorage.setItem('preferred_language', langCode)
    
    // Update HTML lang attribute and dir for RTL
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode
      const selectedLang = LANGUAGES.find(lang => lang.code === langCode)
      if (selectedLang?.rtl) {
        document.documentElement.dir = 'rtl'
      } else {
        document.documentElement.dir = 'ltr'
      }
    }
    
    // Dispatch custom event for LanguageProvider to react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: langCode } }))
    }
  }

  // Use default language during SSR to avoid hydration mismatch
  const currentLanguage = LANGUAGES.find(lang => lang.code === currentLang) || LANGUAGES[0]

  return (
    <div className="flex items-center">
      <Select value={currentLang} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs border-slate-300 bg-white/80 hover:bg-white">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-slate-600" />
            <SelectValue placeholder="Select language">
              <span className="flex items-center gap-1.5">
                <span>{currentLanguage.flag}</span>
                <span className="hidden sm:inline">{currentLanguage.name}</span>
                <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
              </span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                <span className="text-xs text-slate-500">({lang.code})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

