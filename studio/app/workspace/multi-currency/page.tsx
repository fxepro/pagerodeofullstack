"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  Coins,
  Package,
  FileCode,
  Code,
  Database
} from "lucide-react";
import { applyTheme } from "@/lib/theme";
import { usePermissions } from "@/hooks/use-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Currency data
interface Currency {
  code: string;
  name: string;
  type: 'fiat' | 'crypto';
  status: 'active' | 'inactive' | 'pending';
  paymentProviders: string[];
  implementationDate: string | null;
  lastUpdated: string | null;
  exchangeRateSource: string | null;
  conversionEnabled: boolean;
}

interface PackageInfo {
  name: string;
  type: 'frontend' | 'backend' | 'api';
  purpose: string;
  status: 'used' | 'not-used' | 'planned';
  version?: string;
}

interface ImplementationStatus {
  page: string;
  component: string;
  currencyFields: string[];
  status: 'implemented' | 'partial' | 'not-implemented';
  lastChecked: string;
  notes: string;
}

export default function MultiCurrencyPage() {
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Currency implementation data
  const [currencies, setCurrencies] = useState<Currency[]>([
    // Cryptocurrencies (via Coinbase)
    // Cryptocurrencies will be implemented after Coinbase goes live
    // Currently planned but not active
    {
      code: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      status: 'pending',
      paymentProviders: ['Coinbase Commerce'],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: 'Coinbase Commerce API',
      conversionEnabled: false,
    },
    {
      code: 'ETH',
      name: 'Ethereum',
      type: 'crypto',
      status: 'pending',
      paymentProviders: ['Coinbase Commerce'],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: 'Coinbase Commerce API',
      conversionEnabled: false,
    },
    {
      code: 'USDC',
      name: 'USD Coin',
      type: 'crypto',
      status: 'pending',
      paymentProviders: ['Coinbase Commerce'],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: 'Coinbase Commerce API',
      conversionEnabled: false,
    },
    {
      code: 'LTC',
      name: 'Litecoin',
      type: 'crypto',
      status: 'pending',
      paymentProviders: ['Coinbase Commerce'],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: 'Coinbase Commerce API',
      conversionEnabled: false,
    },
    {
      code: 'DOGE',
      name: 'Dogecoin',
      type: 'crypto',
      status: 'pending',
      paymentProviders: ['Coinbase Commerce'],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: 'Coinbase Commerce API',
      conversionEnabled: false,
    },
    {
      code: 'BCH',
      name: 'Bitcoin Cash',
      type: 'crypto',
      status: 'pending',
      paymentProviders: ['Coinbase Commerce'],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: 'Coinbase Commerce API',
      conversionEnabled: false,
    },
    // Fiat currencies
    {
      code: 'USD',
      name: 'US Dollar',
      type: 'fiat',
      status: 'active',
      paymentProviders: ['PayPal', 'Stripe'],
      implementationDate: '2024-01-01',
      lastUpdated: '2024-01-01',
      exchangeRateSource: null,
      conversionEnabled: false,
    },
    {
      code: 'EUR',
      name: 'Euro',
      type: 'fiat',
      status: 'pending',
      paymentProviders: [],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: null,
      conversionEnabled: false,
    },
    {
      code: 'GBP',
      name: 'British Pound',
      type: 'fiat',
      status: 'pending',
      paymentProviders: [],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: null,
      conversionEnabled: false,
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      type: 'fiat',
      status: 'pending',
      paymentProviders: [],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: null,
      conversionEnabled: false,
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      type: 'fiat',
      status: 'pending',
      paymentProviders: [],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: null,
      conversionEnabled: false,
    },
    {
      code: 'AUD',
      name: 'Australian Dollar',
      type: 'fiat',
      status: 'pending',
      paymentProviders: [],
      implementationDate: null,
      lastUpdated: null,
      exchangeRateSource: null,
      conversionEnabled: false,
    },
  ]);

  // Packages data
  const [packages, setPackages] = useState<PackageInfo[]>([
    {
      name: 'Coinbase Commerce API',
      type: 'api',
      purpose: 'Cryptocurrency payment processing',
      status: 'used',
      version: 'v1',
    },
    {
      name: 'Intl.NumberFormat',
      type: 'frontend',
      purpose: 'Currency formatting (built-in JavaScript)',
      status: 'used',
    },
    {
      name: 'currency.js',
      type: 'frontend',
      purpose: 'Currency conversion and formatting',
      status: 'not-used',
    },
    {
      name: 'money.js',
      type: 'frontend',
      purpose: 'Currency conversion library',
      status: 'not-used',
    },
    {
      name: 'exchangerate-api',
      type: 'api',
      purpose: 'Exchange rate API service',
      status: 'not-used',
    },
    {
      name: 'fixer.io',
      type: 'api',
      purpose: 'Exchange rate API service',
      status: 'not-used',
    },
  ]);

  // Implementation status data
  const [implementationStatus, setImplementationStatus] = useState<ImplementationStatus[]>([
    {
      page: '/checkout',
      component: 'studio/app/checkout/page.tsx',
      currencyFields: ['amount', 'currency', 'billingPeriod'],
      status: 'partial',
      lastChecked: new Date().toISOString(),
      notes: 'USD only, no currency selector',
    },
    {
      page: '/checkout/success',
      component: 'studio/app/checkout/success/page.tsx',
      currencyFields: ['amount', 'currency'],
      status: 'partial',
      lastChecked: new Date().toISOString(),
      notes: 'Shows crypto payment info but no currency conversion',
    },
    {
      page: '/workspace/financials',
      component: 'studio/app/workspace/financials/page.tsx',
      currencyFields: ['revenue', 'transactions'],
      status: 'partial',
      lastChecked: new Date().toISOString(),
      notes: 'No currency display or conversion',
    },
    {
      page: '/workspace/profile',
      component: 'studio/app/workspace/profile/page.tsx',
      currencyFields: [],
      status: 'not-implemented',
      lastChecked: new Date().toISOString(),
      notes: 'No currency preference setting',
    },
    {
      page: 'API: /api/payments/paypal/create-subscription',
      component: 'backend/financials/paypal_views.py',
      currencyFields: ['amount', 'currency'],
      status: 'partial',
      lastChecked: new Date().toISOString(),
      notes: 'USD hardcoded, no currency parameter',
    },
    {
      page: 'API: /api/payments/coinbase/create-charge',
      component: 'backend/financials/coinbase_views.py',
      currencyFields: ['amount_usd', 'currency', 'crypto_currency'],
      status: 'implemented',
      lastChecked: new Date().toISOString(),
      notes: 'Multi-crypto support via Coinbase Commerce',
    },
    {
      page: 'Model: BillingTransaction',
      component: 'backend/financials/models.py',
      currencyFields: ['currency', 'amount'],
      status: 'partial',
      lastChecked: new Date().toISOString(),
      notes: 'Currency field exists but defaults to USD, no conversion',
    },
    {
      page: 'Model: CoinbaseTransaction',
      component: 'backend/financials/models.py',
      currencyFields: ['crypto_currency', 'amount_usd', 'exchange_rate'],
      status: 'implemented',
      lastChecked: new Date().toISOString(),
      notes: 'Full crypto currency support with exchange rates',
    },
  ]);

  // Check permission
  useEffect(() => {
    if (!hasPermission('users.view')) {
      // Handle permission error
    }
  }, [hasPermission]);

  // Filter currencies
  const filteredCurrencies = currencies.filter((currency) => {
    const matchesSearch = searchTerm === "" || 
      currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || currency.status === statusFilter;
    const matchesType = typeFilter === "all" || currency.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter implementation status
  const filteredImplementation = implementationStatus.filter((item) => {
    const matchesSearch = searchTerm === "" || 
      item.page.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.currencyFields.some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
      active: { label: "Active", variant: "default", color: "text-green-600" },
      inactive: { label: "Inactive", variant: "secondary", color: "text-gray-600" },
      pending: { label: "Pending", variant: "outline", color: "text-yellow-600" },
      implemented: { label: "Implemented", variant: "default", color: "text-green-600" },
      partial: { label: "Partial", variant: "outline", color: "text-yellow-600" },
      'not-implemented': { label: "Not Implemented", variant: "destructive", color: "text-red-600" },
      used: { label: "Used", variant: "default", color: "text-green-600" },
      'not-used': { label: "Not Used", variant: "secondary", color: "text-gray-600" },
      planned: { label: "Planned", variant: "outline", color: "text-blue-600" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "secondary" as const, color: "text-gray-600" };
    return <Badge variant={statusInfo.variant} className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'crypto' 
      ? <Badge variant="outline" className="text-purple-600">Crypto</Badge>
      : <Badge variant="outline" className="text-blue-600">Fiat</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Multi-Currency</h1>
        <p className="text-muted-foreground mt-1">Manage currency implementations and track status across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Currencies</p>
                <p className="text-h2-dynamic font-bold text-blue-400">
                  {currencies.length}
                </p>
              </div>
              <Coins className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Active</p>
                <p className="text-h2-dynamic font-bold text-green-400">
                  {currencies.filter(c => c.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className={`h-8 w-8 ${applyTheme.status('success')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Cryptocurrencies</p>
                <p className="text-h2-dynamic font-bold text-purple-400">
                  {currencies.filter(c => c.type === 'crypto').length}
                </p>
              </div>
              <Globe className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Fiat Currencies</p>
                <p className="text-h2-dynamic font-bold text-blue-400">
                  {currencies.filter(c => c.type === 'fiat').length}
                </p>
              </div>
              <Coins className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className={applyTheme.card()}>
        <CardContent className={applyTheme.cardContent()}>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search currencies, packages, or pages..."
                className="pl-10 bg-white border-slate-300 text-slate-800 placeholder-slate-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="currencies" className="w-full mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="currencies">
            <Coins className="h-4 w-4 mr-2" />
            Currency Implementation
          </TabsTrigger>
          <TabsTrigger value="status">
            <Search className="h-4 w-4 mr-2" />
            Implementation Status
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Currency Implementation */}
        <TabsContent value="currencies" className="mt-4">
          <Card className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <CardTitle className={applyTheme.text('primary')}>Supported Currencies</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                All currencies implemented across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label>Status:</Label>
                  <select
                    className="px-3 py-1 border rounded"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <Label>Type:</Label>
                  <select
                    className="px-3 py-1 border rounded"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="fiat">Fiat</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency Code</TableHead>
                      <TableHead>Currency Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Providers</TableHead>
                      <TableHead>Exchange Rate Source</TableHead>
                      <TableHead>Conversion Enabled</TableHead>
                      <TableHead>Implementation Date</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCurrencies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Coins className="h-8 w-8 text-slate-400" />
                            <p className={applyTheme.text('secondary')}>No currencies found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCurrencies.map((currency) => (
                        <TableRow key={currency.code}>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                              {currency.code}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium">{currency.name}</TableCell>
                          <TableCell>{getTypeBadge(currency.type)}</TableCell>
                          <TableCell>{getStatusBadge(currency.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {currency.paymentProviders.map((provider) => (
                                <Badge key={provider} variant="outline" className="text-xs">
                                  {provider}
                                </Badge>
                              ))}
                              {currency.paymentProviders.length === 0 && (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {currency.exchangeRateSource ? (
                              <span className="text-sm">{currency.exchangeRateSource}</span>
                            ) : (
                              <span className="text-xs text-slate-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {currency.conversionEnabled ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-500">
                              {currency.implementationDate 
                                ? new Date(currency.implementationDate).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-500">
                              {currency.lastUpdated 
                                ? new Date(currency.lastUpdated).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Packages Section */}
          <Card className={applyTheme.card() + " mt-6"}>
            <CardHeader className={applyTheme.cardHeader()}>
              <CardTitle className={applyTheme.text('primary')}>Packages & Libraries</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                Currency-related packages and libraries used in the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>
                          {pkg.type === 'frontend' && <Badge variant="outline" className="text-blue-600">Frontend</Badge>}
                          {pkg.type === 'backend' && <Badge variant="outline" className="text-green-600">Backend</Badge>}
                          {pkg.type === 'api' && <Badge variant="outline" className="text-purple-600">API</Badge>}
                        </TableCell>
                        <TableCell className="text-sm">{pkg.purpose}</TableCell>
                        <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                        <TableCell>
                          {pkg.version ? (
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">{pkg.version}</code>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Implementation Status */}
        <TabsContent value="status" className="mt-4">
          <Card className={applyTheme.card()}>
            <CardHeader className={applyTheme.cardHeader()}>
              <CardTitle className={applyTheme.text('primary')}>Implementation Status</CardTitle>
              <CardDescription className={applyTheme.text('secondary')}>
                Search all pages and components for currency implementation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label>Status:</Label>
                  <select
                    className="px-3 py-1 border rounded"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="implemented">Implemented</option>
                    <option value="partial">Partial</option>
                    <option value="not-implemented">Not Implemented</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page/Route</TableHead>
                      <TableHead>Component/File</TableHead>
                      <TableHead>Currency Fields</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImplementation.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <FileCode className="h-8 w-8 text-slate-400" />
                            <p className={applyTheme.text('secondary')}>No results found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredImplementation.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.page}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {item.component}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {item.currencyFields.map((field) => (
                                <Badge key={field} variant="outline" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                              {item.currencyFields.length === 0 && (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <span className="text-xs text-slate-500">
                              {new Date(item.lastChecked).toLocaleDateString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">
                            <span className="text-slate-600">{item.notes}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

