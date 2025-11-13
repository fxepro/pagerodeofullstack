'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { captureEvent, identifyUser, captureError } from '@/lib/posthog'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestPostHogPage() {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'success' | 'error'>>({})

  const testEvent = async (eventName: string) => {
    setTestResults(prev => ({ ...prev, [eventName]: 'pending' }))
    try {
      captureEvent(eventName, {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'test_page',
      })
      setTestResults(prev => ({ ...prev, [eventName]: 'success' }))
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev }
          delete newResults[eventName]
          return newResults
        })
      }, 3000)
    } catch (error) {
      setTestResults(prev => ({ ...prev, [eventName]: 'error' }))
    }
  }

  const testIdentify = async () => {
    setTestResults(prev => ({ ...prev, identify: 'pending' }))
    try {
      identifyUser('test-user-' + Date.now(), {
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        test: true,
      })
      setTestResults(prev => ({ ...prev, identify: 'success' }))
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev }
          delete newResults.identify
          return newResults
        })
      }, 3000)
    } catch (error) {
      setTestResults(prev => ({ ...prev, identify: 'error' }))
    }
  }

  const testError = async () => {
    setTestResults(prev => ({ ...prev, error: 'pending' }))
    try {
      captureError(new Error('Test error from PostHog test page'), {
        test: true,
        category: 'TEST',
        feature: 'PostHog Test Page',
      })
      setTestResults(prev => ({ ...prev, error: 'success' }))
      setTimeout(() => {
        setTestResults(prev => {
          const newResults = { ...prev }
          delete newResults.error
          return newResults
        })
      }, 3000)
    } catch (err) {
      setTestResults(prev => ({ ...prev, error: 'error' }))
    }
  }

  const getStatusIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    if (!status) return null
    if (status === 'pending') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />
    return null
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>PostHog Integration Test</CardTitle>
          <CardDescription>
            Test PostHog event tracking, user identification, and error capturing.
            Check your PostHog dashboard to verify events are being received.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Tracking Tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Event Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => testEvent('test_event_simple')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>Test Simple Event</span>
                {getStatusIcon(testResults['test_event_simple'])}
              </Button>
              <Button
                onClick={() => testEvent('test_event_with_properties')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>Test Event with Properties</span>
                {getStatusIcon(testResults['test_event_with_properties'])}
              </Button>
            </div>
          </div>

          {/* User Identification Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Identification</h3>
            <Button
              onClick={testIdentify}
              variant="outline"
              className="w-full justify-between"
            >
              <span>Test User Identification</span>
              {getStatusIcon(testResults.identify)}
            </Button>
          </div>

          {/* Error Tracking Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Error Tracking</h3>
            <Button
              onClick={testError}
              variant="outline"
              className="w-full justify-between"
            >
              <span>Test Error Capture</span>
              {getStatusIcon(testResults.error)}
            </Button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold mb-2">How to Verify</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Open your PostHog dashboard at <a href="https://app.posthog.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">app.posthog.com</a></li>
              <li>Navigate to <strong>Events</strong> or <strong>Activity</strong> tab</li>
              <li>Click the test buttons above</li>
              <li>Check if events appear in PostHog within a few seconds</li>
              <li>Verify event properties are correct</li>
            </ol>
          </div>

          {/* Check PostHog Key */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold mb-2">Configuration Check</h4>
            <p className="text-sm">
              PostHog Key: {process.env.NEXT_PUBLIC_POSTHOG_KEY 
                ? `✅ Configured (${process.env.NEXT_PUBLIC_POSTHOG_KEY.substring(0, 10)}...)` 
                : '❌ Not configured - Add NEXT_PUBLIC_POSTHOG_KEY to .env.local'}
            </p>
            <p className="text-sm mt-2">
              PostHog Host: {process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com (default)'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

