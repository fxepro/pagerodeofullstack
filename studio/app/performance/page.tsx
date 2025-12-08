"use client";
import { Suspense } from "react"
import { PerformanceMain } from "@/components/performance-main"
import { useTranslation } from "react-i18next"

function LoadingFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
        <p className="text-slate-600">{t('performance.loadingAnalyzer')}</p>
      </div>
    </div>
  )
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PerformanceMain />
    </Suspense>
  )
}
