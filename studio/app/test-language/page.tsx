"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestLanguagePage() {
  const [currentLang, setCurrentLang] = useState<string>('en')
  const [htmlLang, setHtmlLang] = useState<string>('en')

  useEffect(() => {
    // Get current language
    const lang = localStorage.getItem('preferred_language') || 'en'
    setCurrentLang(lang)
    setHtmlLang(document.documentElement.lang)

    // Listen for changes
    const handleLanguageChange = (event: CustomEvent) => {
      const newLang = event.detail?.lang || 'en'
      setCurrentLang(newLang)
      setHtmlLang(document.documentElement.lang)
    }

    window.addEventListener('languageChanged', handleLanguageChange as EventListener)

    // Also check periodically for changes
    const interval = setInterval(() => {
      setHtmlLang(document.documentElement.lang)
    }, 500)

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange as EventListener)
      clearInterval(interval)
    }
  }, [])

  // Test text in different languages
  const testTexts: Record<string, string> = {
    en: "This is a test page to verify multi-language font support. The fonts should render correctly for European languages.",
    es: "Esta es una página de prueba para verificar el soporte de fuentes multiidioma. Las fuentes deben renderizarse correctamente para idiomas europeos.",
    fr: "Ceci est une page de test pour vérifier le support des polices multilingues. Les polices doivent s'afficher correctement pour les langues européennes.",
    de: "Dies ist eine Testseite zur Überprüfung der mehrsprachigen Schriftartunterstützung. Die Schriftarten sollten für europäische Sprachen korrekt gerendert werden.",
    it: "Questa è una pagina di test per verificare il supporto dei caratteri multilingue. I caratteri dovrebbero essere visualizzati correttamente per le lingue europee.",
    pt: "Esta é uma página de teste para verificar o suporte de fontes multilíngue. As fontes devem ser renderizadas corretamente para idiomas europeus.",
    pl: "To jest strona testowa do weryfikacji obsługi czcionek wielojęzycznych. Czcionki powinny być poprawnie renderowane dla języków europejskich.",
    ru: "Это тестовая страница для проверки поддержки многоязычных шрифтов. Шрифты должны правильно отображаться для европейских языков.",
    el: "Αυτή είναι μια δοκιμαστική σελίδα για την επαλήθευση της υποστήριξης πολυγλωσσικών γραμματοσειρών. Οι γραμματοσειρές θα πρέπει να αποδίδονται σωστά για τις ευρωπαϊκές γλώσσες.",
  }

  const currentText = testTexts[currentLang] || testTexts.en

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Language & Font Test Page</CardTitle>
          <CardDescription>
            Use the language selector in the top navigation to test different languages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm text-slate-600">
              <strong>Current Language (localStorage):</strong> {currentLang}
            </div>
            <div className="text-sm text-slate-600">
              <strong>HTML lang attribute:</strong> {htmlLang}
            </div>
            <div className="text-sm text-slate-600">
              <strong>Status:</strong>{" "}
              {currentLang === htmlLang ? (
                <span className="text-green-600 font-semibold">✓ Synchronized</span>
              ) : (
                <span className="text-orange-600 font-semibold">⚠ Not synchronized</span>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Test Text Rendering</h3>
            <div className="p-4 bg-slate-50 rounded-lg border">
              <p className="text-base leading-relaxed" style={{ fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
                {currentText}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Font Family Test</h3>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border">
                <div className="text-xs text-slate-500 mb-1">Roboto (Latin, Cyrillic, Greek, Vietnamese)</div>
                <p style={{ fontFamily: 'Roboto, sans-serif' }}>{currentText}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <div className="text-xs text-slate-500 mb-1">Noto Sans (Universal)</div>
                <p style={{ fontFamily: 'Noto Sans, sans-serif' }}>{currentText}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border">
                <div className="text-xs text-slate-500 mb-1">Open Sans (Latin, Cyrillic, Greek, Vietnamese)</div>
                <p style={{ fontFamily: 'Open Sans, sans-serif' }}>{currentText}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700">
              <li>Use the language selector (🌐) in the top navigation bar</li>
              <li>Select a different language</li>
              <li>Observe that the HTML lang attribute updates</li>
              <li>Check that the test text changes to the selected language</li>
              <li>Verify that fonts render correctly for the selected language</li>
              <li>Refresh the page - your language preference should persist</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

