"use client";

import { useEffect, useState } from 'react';
import { getApiBaseUrl, clearApiBaseUrlCache, getCurrentApiBaseUrl } from '@/lib/api-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Debug component to show and manage API base URL configuration
 * Only show in development or for admin users
 */
export function ApiConfigDebug() {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [envUrl, setEnvUrl] = useState<string>('');
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [showComponent, setShowComponent] = useState(false);

  useEffect(() => {
    // Only show in development or if localStorage flag is set
    const showDebug = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('show_api_debug') === 'true';
    setShowComponent(showDebug);

    if (showDebug) {
      updateInfo();
    }
  }, []);

  const updateInfo = () => {
    const current = getCurrentApiBaseUrl();
    const env = process.env.NEXT_PUBLIC_API_BASE_URL || '(not set)';
    const cached = typeof window !== 'undefined' 
      ? localStorage.getItem('pagerodeo_api_base_url') 
      : null;
    
    setApiUrl(current);
    setEnvUrl(env);
    setCachedUrl(cached);
    
    // Validate: should not contain frontend ports
    const hasFrontendPort = current.includes(':3000') || current.includes(':3001');
    setIsValid(!hasFrontendPort && (current === '' || current.includes(':8000') || current.startsWith('https://')));
  };

  const handleClearCache = () => {
    clearApiBaseUrlCache();
    updateInfo();
    // Force page reload to pick up new URL
    window.location.reload();
  };

  const handleRefresh = () => {
    updateInfo();
  };

  if (!showComponent) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 border-2 border-yellow-400 bg-yellow-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">API Config Debug</CardTitle>
          <Badge variant={isValid ? "default" : "destructive"}>
            {isValid ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
            {isValid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Current API base URL configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-semibold">Current URL:</span>
            <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
              {apiUrl || '(empty - using relative URLs)'}
            </div>
          </div>
          
          <div>
            <span className="font-semibold">Env Variable:</span>
            <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
              {envUrl}
            </div>
          </div>
          
          {cachedUrl !== null && (
            <div>
              <span className="font-semibold">Cached URL:</span>
              <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                {cachedUrl || '(empty)'}
              </div>
            </div>
          )}

          {!isValid && (
            <div className="p-2 bg-red-100 border border-red-300 rounded text-xs">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-red-600" />
              <strong>Warning:</strong> API URL contains frontend port (3000/3001).
              Backend should be on port 8000.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefresh}
            className="flex-1"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={handleClearCache}
            className="flex-1"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Cache
          </Button>
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t">
          <strong>Tip:</strong> Set <code className="bg-slate-200 px-1 rounded">NEXT_PUBLIC_API_BASE_URL=http://localhost:8000</code> in <code className="bg-slate-200 px-1 rounded">.env.local</code>
        </div>
      </CardContent>
    </Card>
  );
}

