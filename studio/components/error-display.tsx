/**
 * ErrorDisplay - User-facing error display component
 * Shows formatted errors with retry options and troubleshooting steps
 */

import { AlertCircle, XCircle, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AppError } from '@/types/errors'
import { useErrorDisplay } from '@/hooks/use-error-handler'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from 'react'

interface ErrorDisplayProps {
  error: AppError | null
  onRetry?: () => void
  onDismiss?: () => void
  isRetrying?: boolean
  variant?: 'alert' | 'modal' | 'inline'
  showTechnicalDetails?: boolean
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  variant = 'alert',
  showTechnicalDetails = false
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)
  const displayData = useErrorDisplay(error)

  if (!error || !displayData) {
    return null
  }

  const { message, troubleshooting, displayOptions } = displayData

  // Get icon based on severity
  const Icon = displayOptions.severity === 'error' 
    ? XCircle 
    : displayOptions.severity === 'warning' 
    ? AlertTriangle 
    : AlertCircle

  // Alert variant (non-blocking)
  if (variant === 'alert') {
    // Show error code prominently if it's an HTTP status
    const isHttpStatus = error.code && /^\d{3}$/.test(error.code)
    
    return (
      <Alert variant={displayOptions.severity === 'error' ? 'destructive' : 'default'}>
        <Icon className="h-6 w-6" />
        <AlertTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Error in {error.feature}
            {isHttpStatus && (
              <span className="text-2xl font-bold text-destructive">
                [{error.code}]
              </span>
            )}
          </span>
          {displayOptions.showDismissButton && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-3">{message}</p>
          
          <div className="flex gap-2">
            {displayOptions.showRetryButton && onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Retry
                  </>
                )}
              </Button>
            )}
            
            {displayOptions.showDismissButton && onDismiss && (
              <Button onClick={onDismiss} size="sm" variant="destructive">
                Dismiss
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Modal variant (blocking)
  if (variant === 'modal') {
    // Show error code prominently if it's an HTTP status
    const isHttpStatus = error.code && /^\d{3}$/.test(error.code)
    
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-6 w-6" />
            Error Occurred
            {isHttpStatus && (
              <span className="ml-auto text-5xl font-bold text-destructive opacity-20">
                {error.code}
              </span>
            )}
          </CardTitle>
          <CardDescription>{error.feature}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Code Badge - Prominent Display */}
          {isHttpStatus && (
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <div className="text-7xl font-black text-destructive">
                  {error.code}
                </div>
                <div className="text-center text-xs text-muted-foreground mt-1 font-semibold tracking-wider">
                  HTTP STATUS
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          <div className="text-sm">
            <p className="font-medium mb-2">{message}</p>
          </div>

          {/* Troubleshooting Steps */}
          {troubleshooting.length > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold mb-2">Troubleshooting:</h4>
              <ul className="text-sm space-y-1.5">
                {troubleshooting.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details (Collapsible) */}
          {showTechnicalDetails && error.technicalDetails && (
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  {showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 bg-muted/30 p-3 rounded text-xs font-mono overflow-auto max-h-40">
                  <div><strong>Code:</strong> {error.code}</div>
                  <div><strong>Category:</strong> {error.category}</div>
                  <div><strong>Timestamp:</strong> {error.timestamp}</div>
                  {error.domain && <div><strong>Domain:</strong> {error.domain}</div>}
                  {error.technicalDetails.stack && (
                    <div className="mt-2">
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {error.technicalDetails.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            {displayOptions.showDismissButton && onDismiss && (
              <Button onClick={onDismiss} variant="destructive">
                Dismiss
              </Button>
            )}
            {displayOptions.showRetryButton && onRetry && (
              <Button onClick={onRetry} disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Inline variant (compact)
  return (
    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
      <Icon className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-destructive">{message}</p>
        {troubleshooting.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {troubleshooting[0]}
          </p>
        )}
      </div>
      {displayOptions.showRetryButton && onRetry && (
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          size="sm"
          variant="ghost"
          className="flex-shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
}

/**
 * Retry Progress Indicator
 */
interface RetryProgressProps {
  currentAttempt: number
  maxAttempts: number
  nextRetryDelay: number
}

export function RetryProgress({
  currentAttempt,
  maxAttempts,
  nextRetryDelay
}: RetryProgressProps) {
  const progress = (currentAttempt / maxAttempts) * 100

  return (
    <Alert>
      <RefreshCw className="h-4 w-4 animate-spin" />
      <AlertTitle>Retrying...</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p className="text-sm">
            Attempt {currentAttempt} of {maxAttempts}
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Waiting {(nextRetryDelay / 1000).toFixed(1)}s before retry...
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}

