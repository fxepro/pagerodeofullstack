"use client"

import React, { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import PostHog to avoid SSR issues
const PostHogProvider = dynamic(
  () => import('posthog-js/react').then((mod) => mod.PostHogProvider),
  { ssr: false }
)

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const [posthogClient, setPosthogClient] = useState<any>(null)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (isDev || typeof window === 'undefined') return

    // Dynamically import posthog-js only on client side
    import('posthog-js').then((posthog) => {
      // Fetch server flag to decide if analytics should run
      fetch(`${API_BASE}/api/site-config/public/`)
        .then(res => res.json())
        .then(data => {
          const allow = !!data?.enable_analytics
          const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
          const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
          if (allow && key && key !== 'your_posthog_project_api_key_here') {
            try {
              posthog.default.init(key, {
                api_host: host,
                person_profiles: 'identified_only',
                capture_pageview: true,
                capture_pageleave: true,
              })
              setPosthogClient(posthog.default)
              setEnabled(true)
            } catch {
              setEnabled(false)
            }
          } else {
            setEnabled(false)
          }
        })
        .catch(() => setEnabled(false))
    }).catch(() => setEnabled(false))
  }, [isDev])

  if (isDev || !enabled || !posthogClient) return <>{children}</>
  return <PostHogProvider client={posthogClient}>{children}</PostHogProvider>
}

export function captureEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      import('posthog-js').then((posthog) => {
        if (posthog.default && typeof posthog.default.capture === 'function') {
          posthog.default.capture(eventName, properties)
        }
      }).catch(() => {})
    } catch {}
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      import('posthog-js').then((posthog) => {
        if (posthog.default && typeof posthog.default.identify === 'function') {
          posthog.default.identify(userId, properties)
        }
      }).catch(() => {})
    } catch {}
  }
}

export function resetUser() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      import('posthog-js').then((posthog) => {
        if (posthog.default && typeof posthog.default.reset === 'function') {
          posthog.default.reset()
        }
      }).catch(() => {})
    } catch {}
  }
}

export function captureError(error: Error, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      import('posthog-js').then((posthog) => {
        if (posthog.default && typeof posthog.default.capture === 'function') {
          posthog.default.capture('$exception', {
            $exception_message: error.message,
            $exception_type: error.name,
            $exception_stack: error.stack,
            ...properties,
          })
        }
      }).catch(() => {})
    } catch {}
  }
}

