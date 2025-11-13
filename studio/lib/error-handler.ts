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
  if (!error) return 'UNKNOWN'

  const err = error as any

  // Check error MESSAGE first (more specific than status codes)
  if (err.message?.includes('cannot be resolved')) return 'DNS_ERROR'
  if (err.message?.includes('Domain not found')) return 'DNS_ERROR'
  if (err.message?.includes('ENOTFOUND')) return 'DNS_ERROR'
  if (err.message?.includes('invalid domain')) return 'INVALID_INPUT'
  if (err.message?.includes('certificate') || err.message?.includes('SSL')) return 'SSL_ERROR'
  if (err.message?.includes('CORS') || err.message?.includes('cross-origin')) return 'CORS_ERROR'
  if (err.message?.includes('parse') || err.message?.includes('JSON')) return 'PARSE_ERROR'

  // Network error codes (direct errors, not wrapped in HTTP response)
  if (err.code === 'ENOTFOUND') return 'DNS_ERROR'
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') return 'TIMEOUT'
  if (err.code === 'ECONNREFUSED') return 'NETWORK_ERROR'
  if (err.code === 'ECONNRESET') return 'NETWORK_ERROR'

  // HTTP status errors (check last, less specific)
  if (err.response?.status) {
    const status = err.response.status
    if (status === 401) return 'AUTH_ERROR'
    if (status === 403) return 'FORBIDDEN'
    if (status === 404) return 'NOT_FOUND'
    if (status === 408) return 'TIMEOUT'
    if (status === 429) return 'RATE_LIMITED'
    if (status >= 500) return 'SERVER_ERROR'
    if (status >= 400) return 'CLIENT_ERROR'
  }

  // Also check status property directly (for cases where response is not wrapped)
  if (err.status) {
    const status = err.status
    if (status === 401) return 'AUTH_ERROR'
    if (status === 403) return 'FORBIDDEN'
    if (status === 404) return 'NOT_FOUND'
    if (status === 408) return 'TIMEOUT'
    if (status === 429) return 'RATE_LIMITED'
    if (status >= 500) return 'SERVER_ERROR'
    if (status >= 400) return 'CLIENT_ERROR'
  }

  return 'UNKNOWN'
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

  return {
    category,
    code: err.code || err.response?.status?.toString() || 'UNKNOWN',
    message: err.message || 'An unexpected error occurred',
    feature,
    domain,
    timestamp: new Date().toISOString(),
    retryable: isRetryable(category),
    technicalDetails: {
      stack: err.stack,
      response: err.response?.data,
      config: err.config
    }
  }
}

/**
 * Determine if an error is retryable
 */
export function isRetryable(category: ErrorCategory): boolean {
  const retryableCategories: ErrorCategory[] = [
    'TIMEOUT',
    'NETWORK_ERROR',
    'SERVER_ERROR',
    'RATE_LIMITED'
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
  const messages: Record<ErrorCategory, string> = {
    DNS_ERROR: `Domain "${error.domain || 'unknown'}" cannot be resolved. Please check the spelling and try again.`,
    TIMEOUT: `Request timed out. The server at "${error.domain || 'unknown'}" took too long to respond.`,
    NETWORK_ERROR: `Cannot reach server. Please check your internet connection.`,
    AUTH_ERROR: `Authentication required. Please log in to continue.`,
    FORBIDDEN: `Access denied. The server at "${error.domain || 'unknown'}" blocked the request.`,
    NOT_FOUND: `Page not found. Please verify the URL is correct.`,
    RATE_LIMITED: `Too many requests. Please wait a moment before trying again.`,
    SERVER_ERROR: `Server error occurred. We're automatically retrying...`,
    CLIENT_ERROR: `Invalid request. Please check your input and try again.`,
    INVALID_INPUT: `Invalid input format. Please check and try again.`,
    SSL_ERROR: `SSL certificate is invalid or expired for "${error.domain || 'unknown'}".`,
    CORS_ERROR: `Cross-origin request blocked by the server's security policy.`,
    PARSE_ERROR: `Unable to parse server response. The data may be corrupted.`,
    UNKNOWN: `An unexpected error occurred. Please try again.`
  }

  return messages[error.category] || messages.UNKNOWN
}

/**
 * Get troubleshooting steps for an error
 */
export function getTroubleshootingSteps(error: AppError): string[] {
  const steps: Record<ErrorCategory, string[]> = {
    DNS_ERROR: [
      'Check domain spelling carefully',
      'Try without "www" prefix',
      'Verify the domain exists and is active',
      'Check if you can access it in a browser'
    ],
    TIMEOUT: [
      'The server may be slow or overloaded',
      'Try again in a few moments',
      'Check if the site loads in your browser',
      'Contact the site administrator if issue persists'
    ],
    NETWORK_ERROR: [
      'Check your internet connection',
      'Verify you can access other websites',
      'Try disabling VPN if enabled',
      'Check firewall settings'
    ],
    AUTH_ERROR: [
      'Log in to your account',
      'Check if your session has expired',
      'Verify your credentials are correct'
    ],
    FORBIDDEN: [
      'The server may be blocking automated requests',
      'Try accessing the site in a browser first',
      'Check if the URL requires special permissions',
      'Contact the site administrator'
    ],
    NOT_FOUND: [
      'Check the URL for typos',
      'Verify the page exists',
      'Try the homepage instead',
      'The page may have been moved or deleted'
    ],
    RATE_LIMITED: [
      'Wait a few moments before trying again',
      'You may be making requests too frequently',
      'Consider upgrading for higher rate limits'
    ],
    SERVER_ERROR: [
      'The server is experiencing issues',
      'We\'ll automatically retry',
      'Try again in a few moments',
      'Report to support if issue persists'
    ],
    CLIENT_ERROR: [
      'Check your input for errors',
      'Verify all required fields are filled',
      'Ensure the format is correct'
    ],
    INVALID_INPUT: [
      'Check the format of your input',
      'Example: example.com or https://example.com',
      'Remove any special characters',
      'Ensure the domain is valid'
    ],
    SSL_ERROR: [
      'The site\'s SSL certificate has issues',
      'The certificate may be expired',
      'Contact the site administrator',
      'Proceed with caution if accessing sensitive data'
    ],
    CORS_ERROR: [
      'This is a browser security restriction',
      'The server needs to allow cross-origin requests',
      'Cannot be bypassed from the client side',
      'Contact the API provider'
    ],
    PARSE_ERROR: [
      'The server returned invalid data',
      'Try again later',
      'Report to support with details',
      'The server may be misconfigured'
    ],
    UNKNOWN: [
      'Try again',
      'Refresh the page',
      'Clear browser cache',
      'Report to support if issue persists'
    ]
  }

  return steps[error.category] || steps.UNKNOWN
}

/**
 * Get display options for an error
 */
export function getErrorDisplayOptions(error: AppError): ErrorDisplayOptions {
  return {
    showTechnicalDetails: false, // Admin-only in production
    showRetryButton: error.retryable,
    showDismissButton: true,
    severity: getSeverity(error.category),
    autoRetry: error.category === 'SERVER_ERROR' || error.category === 'TIMEOUT'
  }
}

/**
 * Get error severity
 */
function getSeverity(category: ErrorCategory): 'error' | 'warning' | 'info' {
  const errorCategories: ErrorCategory[] = [
    'DNS_ERROR',
    'AUTH_ERROR',
    'FORBIDDEN',
    'NOT_FOUND',
    'SSL_ERROR',
    'PARSE_ERROR',
    'UNKNOWN'
  ]

  const warningCategories: ErrorCategory[] = [
    'TIMEOUT',
    'NETWORK_ERROR',
    'SERVER_ERROR',
    'CLIENT_ERROR',
    'INVALID_INPUT'
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
          errorCode: error.errorCode,
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

