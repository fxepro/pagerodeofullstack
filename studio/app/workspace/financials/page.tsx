"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, CheckCircle, XCircle, AlertCircle, Settings, RefreshCw, Loader2, Key, Link as LinkIcon } from "lucide-react";
import { applyTheme } from "@/lib/theme";
import axios from "axios";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? 'http://localhost:8000' : 'http://localhost:8000');

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
  const [activeTab, setActiveTab] = useState("stripe");
  const [loading, setLoading] = useState(false);
  const [stripeConfig, setStripeConfig] = useState<PaymentProviderConfig>({
    id: 'stripe',
    name: 'Stripe',
    status: 'disconnected'
  });
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
      // TODO: Implement actual connection logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      if (provider === 'stripe') {
        setStripeConfig(prev => ({ ...prev, status: 'connected' }));
      } else if (provider === 'coinbase') {
        setCoinbaseConfig(prev => ({ ...prev, status: 'connected' }));
      } else if (provider === 'paypal') {
        setPaypalConfig(prev => ({ ...prev, status: 'connected' }));
      }
    } catch (error) {
      console.error(`Error connecting ${provider}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setLoading(true);
    try {
      // TODO: Implement actual disconnection logic
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (provider === 'stripe') {
        setStripeConfig(prev => ({ ...prev, status: 'disconnected', apiKey: undefined }));
      } else if (provider === 'coinbase') {
        setCoinbaseConfig(prev => ({ ...prev, status: 'disconnected', apiKey: undefined }));
      } else if (provider === 'paypal') {
        setPaypalConfig(prev => ({ ...prev, status: 'disconnected', apiKey: undefined }));
      }
    } catch (error) {
      console.error(`Error disconnecting ${provider}:`, error);
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
                    Connect your {config.name} account to enable payment processing and view transaction data.
                  </p>
                  <Button
                    onClick={() => handleConnect(config.id)}
                    disabled={loading}
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
                  <p className="text-2xl font-bold text-slate-800">
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
    <div className={applyTheme.page()}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-palette-primary" />
          Financial Management
        </h1>
        <p className="text-slate-600 mt-2">Manage payment providers and financial integrations</p>
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
          {renderProviderTab(stripeConfig)}
        </TabsContent>

        <TabsContent value="coinbase" className="space-y-6">
          {renderProviderTab(coinbaseConfig)}
        </TabsContent>

        <TabsContent value="paypal" className="space-y-6">
          {renderProviderTab(paypalConfig)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
