"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorDisplay } from "@/components/error-display";
import { useErrorHandler } from "@/hooks/use-error-handler";

export default function TestErrorsPage() {
  const [testing, setTesting] = useState(false);
  const { error, isRetrying, clearError, executeWithErrorHandling } = useErrorHandler();

  const testError = async (errorType: string) => {
    setTesting(true);
    clearError();

    try {
      await executeWithErrorHandling(
        async () => {
          const response = await fetch('/api/test-errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ errorType })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }

          const result = await response.json();
          
          // Check for DNS_NOT_FOUND
          if (result.code === 'DNS_NOT_FOUND') {
            throw new Error(result.message || 'Domain cannot be resolved');
          }

          return result;
        },
        'Error Testing',
        'test-domain.com'
      );
    } catch (err) {
      // Error handled by error handler
    } finally {
      setTesting(false);
    }
  };

  const errorTypes = [
    { type: 'dns', label: 'DNS Error', description: 'Domain not found' },
    { type: 'timeout', label: 'Timeout', description: '408 Request Timeout' },
    { type: 'forbidden', label: 'Forbidden', description: '403 Access Denied' },
    { type: 'notfound', label: 'Not Found', description: '404 Not Found' },
    { type: 'ratelimit', label: 'Rate Limited', description: '429 Too Many Requests' },
    { type: 'server', label: 'Server Error', description: '500 Internal Error' },
    { type: 'auth', label: 'Auth Error', description: '401 Unauthorized' },
    { type: 'network', label: 'Network Error', description: 'Connection refused' },
    { type: 'ssl', label: 'SSL Error', description: 'Certificate invalid' },
    { type: 'parse', label: 'Parse Error', description: 'Invalid JSON' }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Error Testing</h1>
        <p className="text-muted-foreground">
          Test different error scenarios to see how they're displayed to users
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-8">
          <ErrorDisplay
            error={error}
            onRetry={() => {}}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="modal"
          />
        </div>
      )}

      {/* Error Type Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Test Error Types</CardTitle>
          <CardDescription>Click any button to simulate that error type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {errorTypes.map(({ type, label, description }) => (
              <Button
                key={type}
                onClick={() => testError(type)}
                disabled={testing}
                variant="outline"
                className="h-auto py-4 flex flex-col items-start"
              >
                <div className="font-semibold text-left">{label}</div>
                <div className="text-xs text-muted-foreground text-left">{description}</div>
              </Button>
            ))}
          </div>

          {testing && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Testing error...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>What to Check</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>✅ Error icon size (should be bigger)</p>
          <p>✅ Dismiss button color (should be red)</p>
          <p>✅ Error message is user-friendly</p>
          <p>✅ Troubleshooting steps are helpful</p>
          <p>✅ Retry button works (if retryable)</p>
          <p>✅ No console errors (red stack traces)</p>
        </CardContent>
      </Card>
    </div>
  );
}
