/**
 * Centralized Error Types for PageRodeo
 * 
 * Defines all error categories, codes, and interfaces for consistent error handling
 * across all analysis functions.
 */

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  HTTP = 'HTTP',
  APPLICATION = 'APPLICATION',
  VALIDATION = 'VALIDATION',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION = 'AUTH',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorCode {
  // Network Errors
  DNS_NOT_FOUND = 'ENOTFOUND',
  CONNECTION_REFUSED = 'ECONNREFUSED',
  CONNECTION_RESET = 'ECONNRESET',
  NETWORK_TIMEOUT = 'ETIMEDOUT',
  NETWORK_UNREACHABLE = 'ENETUNREACH',
  
  // HTTP Status Errors
  BAD_REQUEST = '400',
  UNAUTHORIZED = '401',
  FORBIDDEN = '403',
  NOT_FOUND = '404',
  TOO_MANY_REQUESTS = '429',
  INTERNAL_SERVER_ERROR = '500',
  BAD_GATEWAY = '502',
  SERVICE_UNAVAILABLE = '503',
  GATEWAY_TIMEOUT = '504',
  
  // Application Errors
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  INVALID_URL = 'INVALID_URL',
  PARSE_ERROR = 'PARSE_ERROR',
  SSL_ERROR = 'SSL_ERROR',
  CORS_ERROR = 'CORS_ERROR',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN'
}

export interface ErrorDetails {
  category: ErrorCategory;
  code: ErrorCode | string;
  message: string;
  technicalMessage?: string;
  retryable: boolean;
  retryAfter?: number; // milliseconds
  statusCode?: number;
  timestamp: string;
  domain?: string;
  feature?: string;
}

export interface AppError {
  category: ErrorCategory | string;
  code: string;
  message: string;
  feature: string;
  domain?: string;
  timestamp: string;
  retryable: boolean;
  technicalDetails?: {
    stack?: string;
    response?: any;
    config?: any;
    details?: string;
  };
}

export interface RetryState {
  currentAttempt: number;
  maxAttempts: number;
  nextRetryDelay: number;
  canRetry: boolean;
}

export interface RetryStrategy {
  shouldRetry: boolean;
  maxAttempts: number;
  delayMs: number;
  useExponentialBackoff: boolean;
}

export type ErrorType = ErrorCategory | string;

export interface ErrorDisplayOptions {
  severity: 'error' | 'warning' | 'info';
  icon?: string;
  color?: string;
  showTechnicalDetails?: boolean;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  autoRetry?: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  useExponentialBackoff: boolean;
}

export interface ErrorHandlerResponse {
  error: ErrorDetails;
  shouldRetry: boolean;
  retryDelay?: number;
  userAction?: string;
  troubleshooting?: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  useExponentialBackoff: true
};

export const ERROR_MESSAGES: Record<string, {
  user: string;
  technical: string;
  action: string;
  troubleshooting: string[];
  retryable: boolean;
}> = {
  [ErrorCode.DNS_NOT_FOUND]: {
    user: 'Domain not found',
    technical: 'DNS resolution failed - domain does not exist or cannot be resolved',
    action: 'Please check the domain spelling and try again',
    troubleshooting: [
      'Verify the domain name is spelled correctly',
      'Try without "www" prefix',
      'Check if the website exists by visiting it in a browser',
      'Ensure you\'re not including http:// or https://'
    ],
    retryable: false
  },
  [ErrorCode.CONNECTION_REFUSED]: {
    user: 'Connection refused',
    technical: 'Server actively refused the connection',
    action: 'The server may be down or not accepting connections',
    troubleshooting: [
      'Check if the website is accessible in a browser',
      'The server might be temporarily offline',
      'Try again in a few minutes'
    ],
    retryable: true
  },
  [ErrorCode.NETWORK_TIMEOUT]: {
    user: 'Request timed out',
    technical: 'Connection timeout - server took too long to respond',
    action: 'The server is responding slowly or not at all',
    troubleshooting: [
      'The server might be overloaded',
      'Your internet connection might be slow',
      'Try again in a moment',
      'Consider increasing the timeout setting'
    ],
    retryable: true
  },
  [ErrorCode.FORBIDDEN]: {
    user: 'Access denied',
    technical: 'HTTP 403 Forbidden - server blocked the request',
    action: 'The server is blocking our analysis tool',
    troubleshooting: [
      'The server has security measures blocking automated requests',
      'This is a server-side restriction we cannot bypass',
      'Try analyzing a different website',
      'Contact the website owner if you control it'
    ],
    retryable: false
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    user: 'Rate limit exceeded',
    technical: 'HTTP 429 Too Many Requests - rate limit reached',
    action: 'Please wait before trying again',
    troubleshooting: [
      'Too many requests sent in a short time',
      'Wait a few minutes before retrying',
      'Consider upgrading for higher rate limits'
    ],
    retryable: true
  },
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    user: 'Server error',
    technical: 'HTTP 500 Internal Server Error',
    action: 'The remote server encountered an error',
    troubleshooting: [
      'This is an error on the remote server',
      'Try again in a moment',
      'The issue should resolve itself'
    ],
    retryable: true
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    user: 'Service unavailable',
    technical: 'HTTP 503 Service Unavailable',
    action: 'The server is temporarily unavailable',
    troubleshooting: [
      'The server is temporarily down or under maintenance',
      'Try again in a few minutes',
      'Check the website status'
    ],
    retryable: true
  },
  [ErrorCode.SSL_ERROR]: {
    user: 'SSL certificate error',
    technical: 'SSL certificate invalid or expired',
    action: 'The website has an invalid security certificate',
    troubleshooting: [
      'The website\'s SSL certificate is invalid or expired',
      'This is a website configuration issue',
      'Try using http:// instead of https:// (not recommended)',
      'Contact the website owner'
    ],
    retryable: false
  },
  [ErrorCode.INVALID_DOMAIN]: {
    user: 'Invalid domain format',
    technical: 'Domain format validation failed',
    action: 'Please enter a valid domain name',
    troubleshooting: [
      'Domain should be in format: example.com',
      'Do not include http:// or https://',
      'Do not include paths or query parameters',
      'Examples: google.com, github.com, example.co.uk'
    ],
    retryable: false
  },
  [ErrorCode.CORS_ERROR]: {
    user: 'Cross-origin request blocked',
    technical: 'CORS policy preventing request',
    action: 'Browser security policy blocking the request',
    troubleshooting: [
      'This is a browser security restriction',
      'The website does not allow cross-origin requests',
      'This cannot be bypassed for security reasons'
    ],
    retryable: false
  }
};

export const DEFAULT_ERROR_MESSAGE = {
  user: 'An unexpected error occurred',
  technical: 'Unknown error',
  action: 'Please try again or contact support if the problem persists',
  troubleshooting: [
    'Refresh the page and try again',
    'Check your internet connection',
    'Try a different browser',
    'Contact support if the issue continues'
  ],
  retryable: true
};

