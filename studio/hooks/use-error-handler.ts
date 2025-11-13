/**
 * useErrorHandler - React hook for error management
 * Provides error handling, retry logic, and state management
 */

import { useState, useCallback } from 'react'
import { 
  AppError,
  RetryState 
} from '@/types/errors'
import {
  createAppError,
  getRetryStrategy,
  formatErrorMessage,
  getTroubleshootingSteps,
  getErrorDisplayOptions,
  executeWithRetry,
  logError
} from '@/lib/error-handler'

export interface UseErrorHandlerReturn {
  error: AppError | null
  isRetrying: boolean
  retryState: RetryState | null
  handleError: (error: unknown, feature: string, domain?: string) => void
  retry: () => Promise<void>
  clearError: () => void
  executeWithErrorHandling: <T>(
    fn: () => Promise<T>,
    feature: string,
    domain?: string
  ) => Promise<T>
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryState, setRetryState] = useState<RetryState | null>(null)
  const [retryFn, setRetryFn] = useState<(() => Promise<void>) | null>(null)

  /**
   * Handle an error
   */
  const handleError = useCallback((
    err: unknown,
    feature: string,
    domain?: string
  ) => {
    const appError = createAppError(err, feature, domain)
    setError(appError)
    logError(appError)

    // Get retry strategy
    const strategy = getRetryStrategy(appError)
    if (strategy.shouldRetry) {
      setRetryState({
        currentAttempt: 0,
        maxAttempts: strategy.maxAttempts,
        nextRetryDelay: strategy.delayMs,
        canRetry: true
      })
    } else {
      setRetryState(null)
    }
  }, [])

  /**
   * Retry the failed operation
   */
  const retry = useCallback(async () => {
    if (!retryFn || !retryState?.canRetry) {
      return
    }

    try {
      setIsRetrying(true)
      await retryFn()
      setError(null)
      setRetryState(null)
    } catch (err) {
      // Error will be handled by the retry function
    } finally {
      setIsRetrying(false)
    }
  }, [retryFn, retryState])

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null)
    setRetryState(null)
    setIsRetrying(false)
    setRetryFn(null)
  }, [])

  /**
   * Execute a function with automatic error handling and retry logic
   */
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>,
    feature: string,
    domain?: string
  ): Promise<T> => {
    clearError()

    try {
      // Store retry function
      setRetryFn(() => async () => {
        await fn()
      })

      // Get retry configuration from first attempt
      let retryConfig = {
        maxAttempts: 1,
        delayMs: 1000,
        useExponentialBackoff: false
      }

      try {
        return await fn()
      } catch (initialError) {
        const appError = createAppError(initialError, feature, domain)
        const strategy = getRetryStrategy(appError)

        if (strategy.shouldRetry) {
          retryConfig = {
            maxAttempts: strategy.maxAttempts,
            delayMs: strategy.delayMs,
            useExponentialBackoff: strategy.useExponentialBackoff
          }

          // Execute with retry
          return await executeWithRetry(fn, {
            ...retryConfig,
            onRetry: (attempt, delay) => {
              setIsRetrying(true)
              setRetryState({
                currentAttempt: attempt,
                maxAttempts: retryConfig.maxAttempts,
                nextRetryDelay: delay,
                canRetry: attempt < retryConfig.maxAttempts
              })
            }
          })
        }

        throw initialError
      }
    } catch (err) {
      handleError(err, feature, domain)
      throw err
    } finally {
      setIsRetrying(false)
    }
  }, [handleError, clearError])

  return {
    error,
    isRetrying,
    retryState,
    handleError,
    retry,
    clearError,
    executeWithErrorHandling
  }
}

/**
 * Hook for getting error display data
 */
export function useErrorDisplay(error: AppError | null) {
  if (!error) {
    return null
  }

  return {
    message: formatErrorMessage(error),
    troubleshooting: getTroubleshootingSteps(error),
    displayOptions: getErrorDisplayOptions(error),
    error
  }
}

