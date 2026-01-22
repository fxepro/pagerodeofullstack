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
  // Allow PostHog in development if explicitly enabled via env var
  const isDev = process.env.NODE_ENV === 'development'
  const allowInDev = process.env.NEXT_PUBLIC_POSTHOG_ENABLE_DEV === 'true'

  useEffect(() => {
    // Debug logging
    console.log('[PostHog] Initialization check:', {
      isDev,
      allowInDev,
      hasWindow: typeof window !== 'undefined',
      shouldSkip: (isDev && !allowInDev) || typeof window === 'undefined'
    })

    // Skip if in dev mode AND not explicitly enabled for dev
    if ((isDev && !allowInDev) || typeof window === 'undefined') {
      console.log('[PostHog] Skipped:', isDev && !allowInDev ? 'Dev mode disabled' : 'No window object')
      return
    }

    console.log('[PostHog] Starting initialization...')

    // Dynamically import posthog-js only on client side
    import('posthog-js').then((posthog) => {
      console.log('[PostHog] Library loaded, fetching site config...')
      
      // Fetch server flag to decide if analytics should run
      fetch(`${API_BASE}/api/site-config/public/`)
        .then(res => {
          console.log('[PostHog] Site config response:', res.status)
          return res.json()
        })
        .then(data => {
          const allow = !!data?.enable_analytics
          const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
          const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
          
          console.log('[PostHog] Config check:', {
            allow,
            hasKey: !!key,
            keyLength: key?.length || 0,
            keyPreview: key ? `${key.substring(0, 10)}...` : 'missing',
            host,
            isPlaceholder: key === 'your_posthog_project_api_key_here'
          })

          if (allow && key && key !== 'your_posthog_project_api_key_here') {
            try {
              console.log('[PostHog] Initializing with key and host:', { key: `${key.substring(0, 10)}...`, host })
              posthog.default.init(key, {
                api_host: host,
                person_profiles: 'identified_only',
                capture_pageview: true,
                capture_pageleave: true,
                loaded: (posthog) => {
                  console.log('[PostHog] ✅ Initialized successfully!')
                }
              })
              setPosthogClient(posthog.default)
              setEnabled(true)
              console.log('[PostHog] ✅ Enabled and ready')
            } catch (error) {
              console.error('[PostHog] ❌ Initialization failed:', error)
              setEnabled(false)
            }
          } else {
            const reasons = []
            if (!allow) reasons.push('Analytics not enabled in settings')
            if (!key) reasons.push('API key missing')
            if (key === 'your_posthog_project_api_key_here') reasons.push('API key is placeholder')
            console.warn('[PostHog] ⚠️ Not initializing:', reasons.join(', '))
            setEnabled(false)
          }
        })
        .catch((error) => {
          console.error('[PostHog] ❌ Failed to fetch site config:', error)
          setEnabled(false)
        })
    }).catch((error) => {
      console.error('[PostHog] ❌ Failed to load posthog-js:', error)
      setEnabled(false)
    })
  }, [isDev, allowInDev])

  // Only skip PostHog provider if disabled or not initialized
  if (!enabled || !posthogClient) return <>{children}</>
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

