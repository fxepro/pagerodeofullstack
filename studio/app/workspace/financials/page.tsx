"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle, XCircle, AlertCircle, Settings, RefreshCw, Loader2, Key, Link as LinkIcon, Table } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import axios from "axios";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? 'http://localhost:8000' : 'http://localhost:8000');

// Helper function to refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) {
    return null;
  }
  
  try {
    const res = await axios.post(`${API_BASE}/api/token/refresh/`, {
      refresh: refreshToken,
    });
    const newAccessToken = res.data.access;
    localStorage.setItem("access_token", newAccessToken);
    // Update refresh token if a new one is provided (token rotation)
    if (res.data.refresh) {
      localStorage.setItem("refresh_token", res.data.refresh);
    }
    return newAccessToken;
  } catch (err) {
    console.error("Token refresh failed:", err);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return null;
  }
};

// Helper function to make authenticated request with retry
const makeAuthenticatedRequest = async (url: string, config: any = {}) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token available");
  }

  const method = config.method || 'GET';
  const methodLower = method.toLowerCase();
  const requestData = config.data || config.body;
  
  const makeRequest = async (authToken: string) => {
    const headers = {
      ...config.headers,
      Authorization: `Bearer ${authToken}`,
    };

    if (methodLower === 'post') {
      return await axios.post(url, requestData, { ...config, headers });
    } else if (methodLower === 'put') {
      return await axios.put(url, requestData, { ...config, headers });
    } else if (methodLower === 'patch') {
      return await axios.patch(url, requestData, { ...config, headers });
    } else if (methodLower === 'delete') {
      return await axios.delete(url, { ...config, headers, data: requestData });
    } else {
      return await axios.get(url, { ...config, headers });
    }
  };

  try {
    return await makeRequest(token);
  } catch (err: any) {
    // If 401, try to refresh token and retry
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return await makeRequest(newToken);
      }
      throw err; // Re-throw if refresh failed
    }
    // 503 (Service Unavailable) is expected when payment provider is not configured
    // Don't treat it as an error that needs token refresh
    throw err;
  }
};

interface PaymentProviderConfig {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  apiKey?: string;
  webhookUrl?: string;
  lastSync?: string;
  transactionsCount?: number;
  revenue?: number;
}

export default function AdminFinancialsPage() {
  const [activeTab, setActiveTab] = useState("coinbase");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [stripeConfig, setStripeConfig] = useState<PaymentProviderConfig>({
    id: 'stripe',
    name: 'Stripe',
    status: 'disconnected'
  });
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [stripeProducts, setStripeProducts] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingStripeData, setLoadingStripeData] = useState(false);
  const [paypalStatus, setPaypalStatus] = useState<any>(null);
  const [paypalProducts, setPaypalProducts] = useState<any[]>([]);
  const [paypalSubscriptionPlans, setPaypalSubscriptionPlans] = useState<any[]>([]);
  const [paypalIntegrationDetails, setPaypalIntegrationDetails] = useState<any>(null);
  const [loadingPaypalData, setLoadingPaypalData] = useState(false);
  const [coinbaseConfig, setCoinbaseConfig] = useState<PaymentProviderConfig>({
    id: 'coinbase',
    name: 'Coinbase',
    status: 'disconnected'
  });
  const [paypalConfig, setPaypalConfig] = useState<PaymentProviderConfig>({
    id: 'paypal',
    name: 'PayPal',
    status: 'disconnected'
  });

  // Fetch provider configurations on mount
  React.useEffect(() => {
    fetchProviders();
  }, []);

  // Fetch data when respective tab is active
  React.useEffect(() => {
    if (activeTab === 'stripe') {
      fetchStripeData();
    } else if (activeTab === 'paypal') {
      fetchPaypalData();
    }
  }, [activeTab]);

  const fetchProviders = async () => {
    setFetching(true);
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE}/api/payments/providers/`);

      const providers = response.data;
      providers.forEach((provider: any) => {
        const config: PaymentProviderConfig = {
          id: provider.id,
          name: provider.name,
          status: provider.status,
          apiKey: provider.client_id ? '••••••••' : undefined,
          webhookUrl: provider.webhook_url || undefined,
          lastSync: provider.last_sync || undefined,
          transactionsCount: provider.transactions_count || 0,
          revenue: provider.revenue || 0,
        };

        if (provider.id === 'stripe') {
          setStripeConfig(config);
        } else if (provider.id === 'coinbase') {
          setCoinbaseConfig(config);
        } else if (provider.id === 'paypal') {
          setPaypalConfig(config);
        }
      });
    } catch (error: any) {
      console.error("Error fetching providers:", error);
    } finally {
      setFetching(false);
    }
  };

  const fetchStripeData = async () => {
    setLoadingStripeData(true);
    try {
      // Fetch Stripe status
      try {
        const statusResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/stripe/status`);
        setStripeStatus(statusResponse.data);
        
        // Update stripeConfig status based on actual Stripe configuration
        if (statusResponse.data.configured) {
          setStripeConfig(prev => ({ ...prev, status: 'connected' }));
        } else {
          setStripeConfig(prev => ({ ...prev, status: 'disconnected' }));
        }
      } catch (error: any) {
        // 503 is expected when Stripe is not configured - not a critical error
        if (error.response?.status !== 503) {
          console.error("Error fetching Stripe status:", error);
        }
        setStripeStatus({ configured: false, mode: 'test' });
      }

      // Fetch Stripe products
      try {
        const productsResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/stripe/products`);
        setStripeProducts(productsResponse.data.products || []);
      } catch (error: any) {
        // 503 is expected when Stripe is not configured - not a critical error
        if (error.response?.status !== 503) {
          console.error("Error fetching Stripe products:", error);
        }
        setStripeProducts([]);
      }

      // Fetch subscription plans with Stripe IDs
      try {
        const plansResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/stripe/plans`);
        setSubscriptionPlans(plansResponse.data.plans || []);
      } catch (error: any) {
        // 503 is expected when Stripe is not configured - not a critical error
        if (error.response?.status !== 503) {
          console.error("Error fetching subscription plans:", error);
        }
        setSubscriptionPlans([]);
      }
    } catch (error: any) {
      console.error("Error fetching Stripe data:", error);
    } finally {
      setLoadingStripeData(false);
    }
  };

  const fetchPaypalData = async () => {
    setLoadingPaypalData(true);
    try {
      // Fetch PayPal status
      try {
        const statusResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/paypal/status`);
        setPaypalStatus(statusResponse.data);
        
        // Update paypalConfig status based on actual PayPal configuration
        if (statusResponse.data.configured) {
          setPaypalConfig(prev => ({ ...prev, status: 'connected' }));
        } else {
          setPaypalConfig(prev => ({ ...prev, status: 'disconnected' }));
        }
      } catch (error: any) {
        // 503 is expected when PayPal is not configured - not a critical error
        if (error.response?.status !== 503) {
          console.error("Error fetching PayPal status:", error);
        }
        setPaypalStatus({ configured: false, mode: 'sandbox' });
      }

      // Fetch PayPal products
      try {
        const productsResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/paypal/products`);
        setPaypalProducts(productsResponse.data.products || []);
      } catch (error: any) {
        // 503 is expected when PayPal is not configured - not a critical error
        // 500 might occur if PayPal API is unavailable or credentials are invalid
        if (error.response?.status !== 503 && error.response?.status !== 500) {
          console.error("Error fetching PayPal products:", error);
        } else if (error.response?.status === 500) {
          // Log 500 errors but don't spam console - PayPal API might be down or misconfigured
          console.warn("PayPal API error (500):", error.response?.data?.error || "PayPal service unavailable");
        }
        setPaypalProducts([]);
      }

      // Fetch subscription plans with PayPal IDs
      try {
        const plansResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/paypal/plans`);
        setPaypalSubscriptionPlans(plansResponse.data.plans || []);
      } catch (error: any) {
        // 503 is expected when PayPal is not configured - not a critical error
        if (error.response?.status !== 503) {
          console.error("Error fetching subscription plans:", error);
        }
        setPaypalSubscriptionPlans([]);
      }

      // Fetch detailed integration information
      try {
        const detailsResponse = await makeAuthenticatedRequest(`${API_BASE}/api/payments/paypal/integration-details`);
        setPaypalIntegrationDetails(detailsResponse.data);
      } catch (error: any) {
        // 503 is expected when PayPal is not configured - not a critical error
        if (error.response?.status !== 503 && error.response?.status !== 500) {
          console.error("Error fetching PayPal integration details:", error);
        }
        setPaypalIntegrationDetails(null);
      }
    } catch (error: any) {
      console.error("Error fetching PayPal data:", error);
    } finally {
      setLoadingPaypalData(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500 text-white">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Connected</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleConnect = async (provider: string) => {
    setLoading(true);
    try {
      // For Coinbase, we need API key from user input
      // For now, we'll show a form to enter API key
      // In a real implementation, you'd show a modal/form
      if (provider === 'coinbase') {
        // Prompt for API key (in production, use a proper form/modal)
        const apiKey = prompt('Enter your Coinbase Commerce API Key:');
        if (!apiKey) {
          setLoading(false);
          return;
        }

        // Update provider configuration
        await makeAuthenticatedRequest(
          `${API_BASE}/api/payments/providers/${provider}/update/`,
          {
            method: 'POST',
            data: {
              client_id: apiKey,  // Coinbase uses API key as client_id
              is_active: true,
              is_live: false,  // Default to sandbox
            }
          }
        );

        // Test connection
        await makeAuthenticatedRequest(
          `${API_BASE}/api/payments/providers/${provider}/test/`,
          {
            method: 'POST',
            data: {}
          }
        );

        // Refresh providers
        await fetchProviders();
      } else if (provider === 'paypal') {
        // Similar for PayPal
        const clientId = prompt('Enter your PayPal Client ID:');
        const clientSecret = prompt('Enter your PayPal Client Secret:');
        
        if (!clientId || !clientSecret) {
          setLoading(false);
          return;
        }

        await makeAuthenticatedRequest(
          `${API_BASE}/api/payments/providers/${provider}/update/`,
          {
            method: 'POST',
            data: {
              client_id: clientId,
              client_secret: clientSecret,
              is_active: true,
              is_live: false,
            }
          }
        );

        await makeAuthenticatedRequest(
          `${API_BASE}/api/payments/providers/${provider}/test/`,
          {
            method: 'POST',
            data: {}
          }
        );

        await fetchProviders();
      } else if (provider === 'stripe') {
        // Stripe uses environment variables, so we just test the connection
        await makeAuthenticatedRequest(
          `${API_BASE}/api/payments/providers/${provider}/test/`,
          {
            method: 'POST',
            data: {}
          }
        );
        await fetchProviders();
      }
    } catch (error: any) {
      console.error(`Error connecting ${provider}:`, error);
      alert(error.response?.data?.error || `Failed to connect ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return;
    }

    setLoading(true);
    try {
      // Deactivate provider
      await makeAuthenticatedRequest(
        `${API_BASE}/api/payments/providers/${provider}/update/`,
        {
          method: 'POST',
          data: {
            is_active: false,
          }
        }
      );

      // Refresh providers
      await fetchProviders();
    } catch (error: any) {
      console.error(`Error disconnecting ${provider}:`, error);
      alert(error.response?.data?.error || `Failed to disconnect ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const renderProviderTab = (config: PaymentProviderConfig) => {
    const isConnected = config.status === 'connected';
    
    return (
      <div className="space-y-6">
        {/* Connection Status Card */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(config.status)}
                <div>
                  <CardTitle>{config.name} Integration</CardTitle>
                  <CardDescription>
                    {isConnected ? 'Connected and ready to process payments' : 'Connect your account to start processing payments'}
                  </CardDescription>
                </div>
              </div>
              {getStatusBadge(config.status)}
            </div>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-slate-600">Status</Label>
                    <p className="text-sm font-medium text-green-600">Active</p>
                  </div>
                  {config.lastSync && (
                    <div>
                      <Label className="text-sm text-slate-600">Last Sync</Label>
                      <p className="text-sm font-medium">{new Date(config.lastSync).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDisconnect(config.id)}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                  <Button variant="outline" disabled={loading}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-4">
                    {config.id === 'coinbase' 
                      ? 'Connect your Coinbase Commerce account by entering your API key. You can get your API key from the Coinbase Commerce dashboard.'
                      : config.id === 'paypal'
                      ? 'Connect your PayPal account by entering your Client ID and Client Secret from the PayPal Developer Dashboard.'
                      : 'Connect your account to enable payment processing and view transaction data.'}
                  </p>
                  <Button
                    onClick={() => handleConnect(config.id)}
                    disabled={loading || fetching}
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Connect {config.name}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        {isConnected && (
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Manage your {config.name} integration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor={`${config.id}-api-key`}>API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id={`${config.id}-api-key`}
                    type="password"
                    placeholder="Enter API key"
                    value={config.apiKey || ''}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon">
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {config.webhookUrl && (
                <div>
                  <Label htmlFor={`${config.id}-webhook`}>Webhook URL</Label>
                  <Input
                    id={`${config.id}-webhook`}
                    value={config.webhookUrl}
                    readOnly
                    className="mt-1 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics Card */}
        {isConnected && (
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>Payment processing metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Total Transactions</p>
                  <p className="text-h2-dynamic font-bold text-slate-800">
                    {config.transactionsCount?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${config.revenue?.toLocaleString() || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Success Rate</p>
                  <p className="text-2xl font-bold text-slate-800">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transactions/Activity Card */}
        {isConnected && (
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest transactions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-400" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs text-slate-400 mt-1">Transaction history will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Financial Management</h1>
        <p className="text-muted-foreground mt-1">Manage payment providers and financial integrations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Connected Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {[stripeConfig, coinbaseConfig, paypalConfig].filter(c => c.status === 'connected').length}
            </div>
            <p className="text-xs text-slate-500 mt-1">of 3 providers</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${([stripeConfig, coinbaseConfig, paypalConfig].reduce((sum, c) => sum + (c.revenue || 0), 0)).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {([stripeConfig, coinbaseConfig, paypalConfig].reduce((sum, c) => sum + (c.transactionsCount || 0), 0)).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Across all providers</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Provider Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
            {stripeConfig.status === 'connected' && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="coinbase" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Coinbase
            {coinbaseConfig.status === 'connected' && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="paypal" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            PayPal
            {paypalConfig.status === 'connected' && (
              <CheckCircle className="h-3 w-3 text-green-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="space-y-6">
          <Card className={applyTheme.card()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(stripeStatus?.configured ? 'connected' : stripeConfig.status)}
                  <div>
                    <CardTitle>Stripe Integration</CardTitle>
                    <CardDescription>
                      {stripeStatus?.configured 
                        ? `Stripe is connected (${stripeStatus.mode} mode)`
                        : 'Stripe API keys not configured in environment'}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(stripeStatus?.configured ? 'connected' : stripeConfig.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm text-slate-600">API Keys</Label>
                  <p className="text-sm font-medium mt-1">
                    {stripeStatus?.configured ? (
                      <span className="text-green-600">Configured</span>
                    ) : (
                      <span className="text-slate-400">Not configured</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Mode</Label>
                  <p className="text-sm font-medium mt-1">
                    <Badge variant="outline">{stripeStatus?.mode || 'test'}</Badge>
                  </p>
                </div>
                {stripeStatus?.account && (
                  <>
                    <div>
                      <Label className="text-sm text-slate-600">Account ID</Label>
                      <p className="text-sm font-medium mt-1 font-mono text-xs">
                        {stripeStatus.account.id}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Country</Label>
                      <p className="text-sm font-medium mt-1">
                        {stripeStatus.account.country?.toUpperCase()}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleConnect('stripe');
                    setTimeout(() => fetchStripeData(), 1000);
                  }}
                  disabled={loading || loadingStripeData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          {stripeStatus?.configured && (
            <Card className={applyTheme.card()}>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Payment processing metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {stripeConfig.transactionsCount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${stripeConfig.revenue?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Success Rate</p>
                    <p className="text-2xl font-bold text-slate-800">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans Table */}
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Subscription Plans & Stripe Price IDs
              </CardTitle>
              <CardDescription>
                Plans configured in database with their Stripe price IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStripeData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-palette-primary mr-2" />
                  <span className="text-slate-600">Loading plans...</span>
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No subscription plans found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Plan Name</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Monthly Price</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Annual Price</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Stripe Monthly ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Stripe Annual ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionPlans.map((plan) => (
                        <tr key={plan.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-medium">{plan.display_name}</div>
                            <div className="text-xs text-slate-500">{plan.plan_name}</div>
                          </td>
                          <td className="p-3">${plan.price_monthly.toFixed(2)}</td>
                          <td className="p-3">${plan.price_yearly.toFixed(2)}</td>
                          <td className="p-3">
                            {plan.stripe_plan_id_monthly ? (
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {plan.stripe_plan_id_monthly}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {plan.stripe_plan_id_annual ? (
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {plan.stripe_plan_id_annual}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {plan.is_active ? (
                              <Badge className="bg-green-500 text-white">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stripe Products Table */}
          {stripeProducts.length > 0 && (
            <Card className={applyTheme.card()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Stripe Products & Prices
                </CardTitle>
                <CardDescription>
                  Products and prices registered in your Stripe account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {stripeProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                          )}
                        </div>
                        <Badge variant={product.active ? "default" : "outline"}>
                          {product.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {product.prices && product.prices.length > 0 ? (
                        <div className="overflow-x-auto mt-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Price ID</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Amount</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Currency</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Interval</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.prices.map((price: any) => (
                                <tr key={price.id} className="border-b">
                                  <td className="p-2">
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                      {price.id}
                                    </code>
                                  </td>
                                  <td className="p-2">
                                    ${(price.unit_amount / 100).toFixed(2)}
                                  </td>
                                  <td className="p-2 uppercase">{price.currency}</td>
                                  <td className="p-2 capitalize">
                                    {price.recurring?.interval || 'one-time'}
                                  </td>
                                  <td className="p-2">
                                    <Badge variant={price.active ? "default" : "outline"} className="text-xs">
                                      {price.active ? "Active" : "Inactive"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mt-2">No prices configured</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="coinbase" className="space-y-6">
          {renderProviderTab(coinbaseConfig)}
        </TabsContent>

        <TabsContent value="paypal" className="space-y-6">
          <Card className={applyTheme.card()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(paypalStatus?.configured ? 'connected' : paypalConfig.status)}
                  <div>
                    <CardTitle>PayPal Integration</CardTitle>
                    <CardDescription>
                      {paypalStatus?.configured 
                        ? `PayPal is connected (${paypalStatus.mode} mode)`
                        : 'PayPal API credentials not configured'}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(paypalStatus?.configured ? 'connected' : paypalConfig.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm text-slate-600">API Credentials</Label>
                  <p className="text-sm font-medium mt-1">
                    {paypalStatus?.configured ? (
                      <span className="text-green-600">Configured</span>
                    ) : (
                      <span className="text-slate-400">Not configured</span>
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Mode</Label>
                  <p className="text-sm font-medium mt-1">
                    <Badge variant="outline">{paypalStatus?.mode || 'sandbox'}</Badge>
                  </p>
                </div>
                {paypalStatus?.account && (
                  <>
                    <div>
                      <Label className="text-sm text-slate-600">Account ID</Label>
                      <p className="text-sm font-medium mt-1 font-mono text-xs">
                        {paypalStatus.account.user_id || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Email</Label>
                      <p className="text-sm font-medium mt-1">
                        {paypalStatus.account.email || 'N/A'}
                      </p>
                    </div>
                  </>
                )}
                {paypalIntegrationDetails && (
                  <>
                    <div>
                      <Label className="text-sm text-slate-600">App Name</Label>
                      <p className="text-sm font-medium mt-1">
                        {paypalIntegrationDetails.app_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600">Client ID</Label>
                      <p className="text-sm font-medium mt-1 font-mono text-xs">
                        {paypalIntegrationDetails.client_id ? `${paypalIntegrationDetails.client_id.substring(0, 12)}...` : 'N/A'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Methods */}
              {paypalIntegrationDetails?.payment_methods_available && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Label className="text-sm text-slate-600 mb-2 block">Payment Methods Available</Label>
                  <div className="flex flex-wrap gap-2">
                    {paypalIntegrationDetails.payment_methods_available.map((method: string) => (
                      <Badge key={method} variant="outline" className="capitalize">
                        {method.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                  {paypalIntegrationDetails.recent_transactions_count > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      Based on {paypalIntegrationDetails.recent_transactions_count} recent transaction(s)
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleConnect('paypal');
                    setTimeout(() => fetchPaypalData(), 1000);
                  }}
                  disabled={loading || loadingPaypalData}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          {paypalStatus?.configured && (
            <Card className={applyTheme.card()}>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
                <CardDescription>Payment processing metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {paypalConfig.transactionsCount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${paypalConfig.revenue?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Success Rate</p>
                    <p className="text-2xl font-bold text-slate-800">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Subscription Plans Table */}
          <Card className={applyTheme.card()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                Subscription Plans & PayPal Plan IDs
              </CardTitle>
              <CardDescription>
                Plans configured in database with their PayPal plan IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPaypalData ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-palette-primary mr-2" />
                  <span className="text-slate-600">Loading plans...</span>
                </div>
              ) : paypalSubscriptionPlans.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">No subscription plans found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Plan Name</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Monthly Price</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Annual Price</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">PayPal Monthly ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">PayPal Annual ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Product ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paypalSubscriptionPlans.map((plan) => (
                        <tr key={plan.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-medium">{plan.display_name}</div>
                            <div className="text-xs text-slate-500">{plan.plan_name}</div>
                          </td>
                          <td className="p-3">${plan.price_monthly.toFixed(2)}</td>
                          <td className="p-3">${plan.price_yearly.toFixed(2)}</td>
                          <td className="p-3">
                            {plan.paypal_plan_id_monthly ? (
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {plan.paypal_plan_id_monthly}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {plan.paypal_plan_id_annual ? (
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {plan.paypal_plan_id_annual}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {plan.paypal_product_id ? (
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {plan.paypal_product_id}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">Not set</span>
                            )}
                          </td>
                          <td className="p-3">
                            {plan.is_active ? (
                              <Badge className="bg-green-500 text-white">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PayPal Products Table */}
          {paypalProducts.length > 0 && (
            <Card className={applyTheme.card()}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  PayPal Products & Plans
                </CardTitle>
                <CardDescription>
                  Products and billing plans registered in your PayPal account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {paypalProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.description && (
                            <p className="text-sm text-slate-600 mt-1">{product.description}</p>
                          )}
                        </div>
                        <Badge variant={product.active !== false ? "default" : "outline"}>
                          {product.active !== false ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {product.plans && product.plans.length > 0 ? (
                        <div className="overflow-x-auto mt-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Plan ID</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Name</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Status</th>
                                <th className="text-left p-2 text-xs font-semibold text-slate-600">Billing Cycle</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product.plans.map((plan: any) => (
                                <tr key={plan.id} className="border-b">
                                  <td className="p-2">
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                      {plan.id}
                                    </code>
                                  </td>
                                  <td className="p-2">{plan.name || 'N/A'}</td>
                                  <td className="p-2">
                                    <Badge variant={plan.status === 'ACTIVE' ? "default" : "outline"}>
                                      {plan.status || 'N/A'}
                                    </Badge>
                                  </td>
                                  <td className="p-2">
                                    {plan.billing_cycles?.[0]?.frequency?.interval_unit || 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 mt-2">No plans associated</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
