'use client'

import React from 'react'
import { ErrorDisplay } from './error-display'
import { captureError } from '@/lib/posthog'

interface Props {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to PostHog for error tracking
    captureError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} resetError={this.resetError} />
      }

      // Default error display
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={{
                category: 'UNKNOWN',
                message: this.state.error.message || 'An unexpected error occurred',
                feature: 'Error Boundary',
                domain: window.location.hostname,
                retryable: false,
                code: 'ERROR_BOUNDARY',
                timestamp: new Date().toISOString(),
              }}
              onRetry={this.resetError}
              onDismiss={this.resetError}
              variant="modal"
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

