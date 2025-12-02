/**
 * Error Handler - Core error management utilities
 * Categorizes errors, formats messages, and determines retry strategies
 */

import { 
  AppError, 
  ErrorCategory, 
  ErrorType, 
  RetryStrategy,
  ErrorDisplayOptions 
} from '@/types/errors'

/**
 * Categorize an error based on its type and properties
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return ErrorCategory.UNKNOWN

  const err = error as any

  // Check error MESSAGE first (more specific than status codes)
  if (err.message?.includes('cannot be resolved')) return ErrorCategory.NETWORK
  if (err.message?.includes('Domain not found')) return ErrorCategory.NETWORK
  if (err.message?.includes('ENOTFOUND')) return ErrorCategory.NETWORK
  if (err.message?.includes('invalid domain')) return ErrorCategory.VALIDATION
  if (err.message?.includes('certificate') || err.message?.includes('SSL')) return ErrorCategory.NETWORK
  if (err.message?.includes('CORS') || err.message?.includes('cross-origin')) return ErrorCategory.NETWORK
  if (err.message?.includes('parse') || err.message?.includes('JSON')) return ErrorCategory.APPLICATION

  // Network error codes (direct errors, not wrapped in HTTP response)
  if (err.code === 'ENOTFOUND') return ErrorCategory.NETWORK
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') return ErrorCategory.TIMEOUT
  if (err.code === 'ECONNREFUSED') return ErrorCategory.NETWORK
  if (err.code === 'ECONNRESET') return ErrorCategory.NETWORK

  // HTTP status errors (check last, less specific)
  if (err.response?.status) {
    const status = err.response.status
    if (status === 401) return ErrorCategory.AUTHENTICATION
    if (status === 403) return ErrorCategory.HTTP
    if (status === 404) return ErrorCategory.HTTP
    if (status === 408) return ErrorCategory.TIMEOUT
    if (status === 429) return ErrorCategory.RATE_LIMIT
    if (status >= 500) return ErrorCategory.HTTP
    if (status >= 400) return ErrorCategory.HTTP
  }

  // Also check status property directly (for cases where response is not wrapped)
  if (err.status) {
    const status = err.status
    if (status === 401) return ErrorCategory.AUTHENTICATION
    if (status === 403) return ErrorCategory.HTTP
    if (status === 404) return ErrorCategory.HTTP
    if (status === 408) return ErrorCategory.TIMEOUT
    if (status === 429) return ErrorCategory.RATE_LIMIT
    if (status >= 500) return ErrorCategory.HTTP
    if (status >= 400) return ErrorCategory.HTTP
  }

  return ErrorCategory.UNKNOWN
}

/**
 * Create an AppError from any error
 */
export function createAppError(
  error: unknown,
  feature: string,
  domain?: string
): AppError {
  const category = categorizeError(error)
  const err = error as any

  // Build error message - include details if available
  let errorMessage = err.message || 'An unexpected error occurred';
  if (err.details) {
    errorMessage = `${errorMessage}: ${err.details}`;
  } else if (err.response?.data?.details) {
    errorMessage = `${errorMessage}: ${err.response.data.details}`;
  } else if (err.response?.data?.error && err.response.data.error !== errorMessage) {
    errorMessage = err.response.data.error;
    if (err.response.data.details) {
      errorMessage = `${errorMessage}: ${err.response.data.details}`;
    }
  }

  return {
    category,
    code: err.code || err.errorCode || err.response?.status?.toString() || 'UNKNOWN',
    message: errorMessage,
    feature,
    domain,
    timestamp: new Date().toISOString(),
    retryable: err.retryable !== undefined ? err.retryable : isRetryable(category),
    technicalDetails: {
      stack: err.stack,
      response: err.response?.data,
      config: err.config,
      details: err.details
    }
  }
}

/**
 * Determine if an error is retryable
 */
export function isRetryable(category: ErrorCategory): boolean {
  const retryableCategories: ErrorCategory[] = [
    ErrorCategory.TIMEOUT,
    ErrorCategory.NETWORK,
    ErrorCategory.HTTP,
    ErrorCategory.RATE_LIMIT
  ]
  return retryableCategories.includes(category)
}

/**
 * Get retry strategy for an error
 */
export function getRetryStrategy(error: AppError): RetryStrategy {
  // Don't retry non-retryable errors
  if (!error.retryable) {
    return {
      shouldRetry: false,
      maxAttempts: 0,
      delayMs: 0,
      useExponentialBackoff: false
    }
  }

  // Rate limited - use specified delay
  if (error.category === 'RATE_LIMITED') {
    const retryAfter = error.technicalDetails?.response?.headers?.['retry-after']
    const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000
    return {
      shouldRetry: true,
      maxAttempts: 1,
      delayMs,
      useExponentialBackoff: false
    }
  }

  // Server errors - aggressive retry
  if (error.category === 'SERVER_ERROR') {
    return {
      shouldRetry: true,
      maxAttempts: 3,
      delayMs: 1000,
      useExponentialBackoff: true
    }
  }

  // Network/timeout - moderate retry
  if (error.category === 'TIMEOUT' || error.category === 'NETWORK_ERROR') {
    return {
      shouldRetry: true,
      maxAttempts: 2,
      delayMs: 2000,
      useExponentialBackoff: true
    }
  }

  return {
    shouldRetry: false,
    maxAttempts: 0,
    delayMs: 0,
    useExponentialBackoff: false
  }
}

/**
 * Format user-friendly error message
 */
export function formatErrorMessage(error: AppError): string {
  const category = typeof error.category === 'string' ? error.category as ErrorCategory : error.category
  const messages: Record<ErrorCategory, string> = {
    [ErrorCategory.NETWORK]: `Network error: "${error.domain || 'unknown'}" cannot be reached. Please check the domain and try again.`,
    [ErrorCategory.HTTP]: `HTTP error occurred. Please try again.`,
    [ErrorCategory.APPLICATION]: `Application error occurred. Please try again.`,
    [ErrorCategory.VALIDATION]: `Invalid input format. Please check and try again.`,
    [ErrorCategory.TIMEOUT]: `Request timed out. The server at "${error.domain || 'unknown'}" took too long to respond.`,
    [ErrorCategory.AUTHENTICATION]: `Authentication required. Please log in to continue.`,
    [ErrorCategory.RATE_LIMIT]: `Too many requests. Please wait a moment before trying again.`,
    [ErrorCategory.UNKNOWN]: `An unexpected error occurred. Please try again.`
  }

  return messages[category] || messages[ErrorCategory.UNKNOWN]
}

/**
 * Get troubleshooting steps for an error
 */
export function getTroubleshootingSteps(error: AppError): string[] {
  const category = typeof error.category === 'string' ? error.category as ErrorCategory : error.category
  const steps: Record<ErrorCategory, string[]> = {
    [ErrorCategory.NETWORK]: [
      'Check domain spelling carefully',
      'Try without "www" prefix',
      'Verify the domain exists and is active',
      'Check your internet connection',
      'Check if you can access it in a browser'
    ],
    [ErrorCategory.HTTP]: [
      'Check the URL for typos',
      'The server may be blocking automated requests',
      'Try accessing the site in a browser first',
      'Contact the site administrator if issue persists'
    ],
    [ErrorCategory.APPLICATION]: [
      'The server returned invalid data',
      'Try again later',
      'Report to support with details',
      'The server may be misconfigured'
    ],
    [ErrorCategory.VALIDATION]: [
      'Check the format of your input',
      'Example: example.com or https://example.com',
      'Remove any special characters',
      'Ensure the domain is valid'
    ],
    [ErrorCategory.TIMEOUT]: [
      'The server may be slow or overloaded',
      'Try again in a few moments',
      'Check if the site loads in your browser',
      'Contact the site administrator if issue persists'
    ],
    [ErrorCategory.AUTHENTICATION]: [
      'Log in to your account',
      'Check if your session has expired',
      'Verify your credentials are correct'
    ],
    [ErrorCategory.RATE_LIMIT]: [
      'Wait a few moments before trying again',
      'You may be making requests too frequently',
      'Consider upgrading for higher rate limits'
    ],
    [ErrorCategory.UNKNOWN]: [
      'Try again',
      'Refresh the page',
      'Clear browser cache',
      'Report to support if issue persists'
    ]
  }

  return steps[category] || steps[ErrorCategory.UNKNOWN]
}

/**
 * Get display options for an error
 */
export function getErrorDisplayOptions(error: AppError): ErrorDisplayOptions {
  const category = typeof error.category === 'string' ? error.category as ErrorCategory : error.category
  return {
    showTechnicalDetails: false, // Admin-only in production
    showRetryButton: error.retryable,
    showDismissButton: true,
    severity: getSeverity(category),
    autoRetry: category === ErrorCategory.HTTP || category === ErrorCategory.TIMEOUT
  }
}

/**
 * Get error severity
 */
function getSeverity(category: ErrorCategory): 'error' | 'warning' | 'info' {
  const errorCategories: ErrorCategory[] = [
    ErrorCategory.NETWORK,
    ErrorCategory.AUTHENTICATION,
    ErrorCategory.APPLICATION,
    ErrorCategory.UNKNOWN
  ]

  const warningCategories: ErrorCategory[] = [
    ErrorCategory.TIMEOUT,
    ErrorCategory.HTTP,
    ErrorCategory.VALIDATION
  ]

  if (errorCategories.includes(category)) return 'error'
  if (warningCategories.includes(category)) return 'warning'
  return 'info'
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number = 10000
): number {
  const delay = baseDelay * Math.pow(2, attempt - 1)
  return Math.min(delay, maxDelay)
}

/**
 * Execute function with retry logic
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number
    delayMs: number
    useExponentialBackoff: boolean
    onRetry?: (attempt: number, delay: number) => void
  }
): Promise<T> {
  let lastError: unknown
  
  // HARD LIMIT: Never retry more than 3 times
  const maxRetries = Math.min(options.maxAttempts, 3)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        throw error
      }

      // Calculate delay
      const delay = options.useExponentialBackoff
        ? calculateBackoffDelay(attempt, options.delayMs)
        : options.delayMs

      // Notify about retry
      if (options.onRetry) {
        options.onRetry(attempt, delay)
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Log error to PostHog and console
 */
export function logError(error: AppError): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔴 [Error Handler]', {
      category: error?.category,
      message: error?.message?.substring(0, 100) + '...',
      feature: error?.feature,
      domain: error?.domain,
      retryable: error?.retryable
    })
  }

  // Send to PostHog for error tracking
  try {
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('@/lib/posthog').then(({ captureError }) => {
        captureError(new Error(error.message), {
          category: error.category,
          feature: error.feature,
          domain: error.domain,
          retryable: error.retryable,
          errorCode: error.code,
          timestamp: new Date().toISOString(),
        })
      }).catch(() => {
        // PostHog not available, skip
      })
    }
  } catch (err) {
    // PostHog capture failed, continue without breaking the app
    console.warn('Failed to send error to PostHog:', err)
  }
}

