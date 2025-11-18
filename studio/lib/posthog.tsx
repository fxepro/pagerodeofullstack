"use client"

import React, { useEffect, useMemo, useState } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000')

export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (isDev) return

    // Fetch server flag to decide if analytics should run
    fetch(`${API_BASE}/api/site-config/public/`)
      .then(res => res.json())
      .then(data => {
        const allow = !!data?.enable_analytics
        const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
        const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
        if (allow && key && key !== 'your_posthog_project_api_key_here') {
          try {
            posthog.init(key, {
              api_host: host,
              person_profiles: 'identified_only',
              capture_pageview: true,
              capture_pageleave: true,
            })
            setEnabled(true)
          } catch {
            setEnabled(false)
          }
        } else {
          setEnabled(false)
        }
      })
      .catch(() => setEnabled(false))
  }, [isDev])

  if (isDev || !enabled) return <>{children}</>
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

export function captureEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture(eventName, properties)
      }
    } catch {}
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      if (posthog && typeof posthog.identify === 'function') {
        posthog.identify(userId, properties)
      }
    } catch {}
  }
}

export function resetUser() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      if (posthog && typeof posthog.reset === 'function') {
        posthog.reset()
      }
    } catch {}
  }
}

export function captureError(error: Error, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    try {
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture('$exception', {
          $exception_message: error.message,
          $exception_type: error.name,
          $exception_stack: error.stack,
          ...properties,
        })
      }
    } catch {}
  }
}

