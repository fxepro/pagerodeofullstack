'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

// Initialize PostHog on client side
if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (posthogKey && posthogKey !== 'your_posthog_project_api_key_here') {
    try {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[PostHog] ✅ Initialized successfully', { 
              key: posthogKey?.substring(0, 10) + '...', 
              host: posthogHost 
            })
          }
        },
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[PostHog] ❌ Initialization failed:', error)
      }
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] ⚠️ NEXT_PUBLIC_POSTHOG_KEY not found or not configured')
    }
  }
}

// Export PostHogProvider wrapper
export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  
  // Only render PostHogProvider if we have a valid key
  if (!posthogKey || posthogKey === 'your_posthog_project_api_key_here') {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

export function captureEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      // Check if PostHog is initialized
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture(eventName, properties)
      }
    } catch (err) {
      // Silently fail if PostHog is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog] Failed to capture event:', eventName, err)
      }
    }
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      // Check if PostHog is initialized
      if (posthog && typeof posthog.identify === 'function') {
        posthog.identify(userId, properties)
      }
    } catch (err) {
      // Silently fail if PostHog is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog] Failed to identify user:', userId, err)
      }
    }
  }
}

export function resetUser() {
  if (typeof window !== 'undefined') {
    try {
      // Check if PostHog is initialized
      if (posthog && typeof posthog.reset === 'function') {
        posthog.reset()
      }
    } catch (err) {
      // Silently fail if PostHog is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog] Failed to reset user:', err)
      }
    }
  }
}

export function captureError(error: Error, properties?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    try {
      // Check if PostHog is initialized
      if (posthog && typeof posthog.capture === 'function') {
        posthog.capture('$exception', {
          $exception_message: error.message,
          $exception_type: error.name,
          $exception_stack: error.stack,
          ...properties,
        })
      }
    } catch (err) {
      // Silently fail if PostHog is not available
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PostHog] Failed to capture error:', err)
      }
    }
  }
}

