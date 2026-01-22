import { Suspense } from "react"
import { SecurityAuditMain } from "@/components/security-audit-main"

function SecurityAuditLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-palette-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Loading Security Audit...</p>
      </div>
    </div>
  )
}

export default function SecurityAuditPage() {
  return (
    <Suspense fallback={<SecurityAuditLoading />}>
      <SecurityAuditMain />
    </Suspense>
  )
}

