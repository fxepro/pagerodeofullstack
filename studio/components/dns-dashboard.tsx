"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Server, Wifi, FileText, RefreshCw, Copy, Clock, Mail } from "lucide-react";
import { useDnsAnalysis } from "@/hooks/use-dns-analysis";
import { ErrorDisplay } from "@/components/error-display";

export default function DnsDashboard({ url: initialUrl = "" }: { url?: string }) {
  const { isChecking, dnsData, handleCheck, error, isRetrying, clearError } = useDnsAnalysis({ initialUrl, autoRun: !!initialUrl });
  const [showAllTxt, setShowAllTxt] = useState(false);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (isChecking) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <RefreshCw className="animate-spin h-12 w-12 text-palette-primary mx-auto mb-4" />
          <p className="text-slate-600">Checking DNS records for {initialUrl}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay 
          error={error}
          onRetry={handleCheck}
          onDismiss={clearError}
          isRetrying={isRetrying}
          variant="alert"
        />
      </div>
    );
  }

  if (!dnsData) return null;

  const totalRecords = dnsData.dns.ipv4.length + dnsData.dns.ipv6.length + dnsData.dns.mx.length + dnsData.dns.txt.length + dnsData.dns.ns.length + (dnsData.dns.soa ? 1 : 0) + dnsData.dns.cname.length + dnsData.dns.srv.length;

  return (
    <div className="p-6">
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-palette-accent-2/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Globe className="h-6 w-6 text-palette-primary" />
                DNS Records for {dnsData.domain}
              </h2>
              <p className="text-slate-600 mt-1">
                Last checked: {formatTimestamp(dnsData.timestamp)} • Total records: {totalRecords}
              </p>
            </div>
            <Button onClick={handleCheck} disabled={isChecking} variant="outline" className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3">
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
          </div>
        </div>

        <Card className="border-palette-accent-2/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center gap-2">
              <Server className="h-5 w-5 text-palette-primary" />
              DNS Records
            </CardTitle>
            <CardDescription className="text-slate-600">Complete DNS configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-4 border border-blue-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    IP Addresses
                  </h3>
                  {(dnsData.dns.ipv4.length > 0 || dnsData.dns.ipv6.length > 0) ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dnsData.dns.ipv4.length + dnsData.dns.ipv6.length} records
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.ipv4.length > 0 ? (
                    <>
                      <div className="text-xs text-slate-600 font-medium mb-1">IPv4 (A Records)</div>
                      {dnsData.dns.ipv4.map((ip, i) => (
                        <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-blue-100">
                          <code className="text-sm text-slate-700 font-mono">{ip}</code>
                          <button onClick={() => copyToClipboard(ip)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {dnsData.dns.ipv6.length > 0 ? (
                    <>
                      <div className="text-xs text-slate-600 font-medium mb-1 mt-3">IPv6 (AAAA Records)</div>
                      {dnsData.dns.ipv6.map((ip, i) => (
                        <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-blue-100">
                          <code className="text-sm text-slate-700 font-mono break-all">{ip}</code>
                          <button onClick={() => copyToClipboard(ip)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {dnsData.dns.ipv4.length === 0 && dnsData.dns.ipv6.length === 0 && (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-palette-accent-3 to-palette-accent-3/50 rounded-lg p-4 border border-palette-accent-2/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Server className="h-4 w-4 text-palette-primary" />
                    Name Servers
                  </h3>
                  {dnsData.dns.ns.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dnsData.dns.ns.length} servers
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.ns.length > 0 ? (
                    dnsData.dns.ns.map((ns, i) => (
                      <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-purple-100">
                        <code className="text-sm text-slate-700 font-mono">{ns}</code>
                        <button onClick={() => copyToClipboard(ns)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-4 border border-green-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    Mail Servers
                  </h3>
                  {dnsData.dns.mx.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dnsData.dns.mx.length} servers
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.mx.length > 0 ? (
                    dnsData.dns.mx.map((mx, i) => (
                      <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-green-100">
                        <code className="text-sm text-slate-700 font-mono">{mx}</code>
                        <button onClick={() => copyToClipboard(mx)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg p-4 border border-yellow-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    TXT Records
                  </h3>
                  {dnsData.dns.txt.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dnsData.dns.txt.length} records
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.txt.length > 0 ? (
                    <>
                      {(showAllTxt ? dnsData.dns.txt : dnsData.dns.txt.slice(0, 3)).map((txt, i) => (
                        <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-yellow-100">
                          <code className="text-xs text-slate-700 font-mono break-all flex-1">
                            {txt.length > 150 ? `${txt.substring(0, 150)}...` : txt}
                          </code>
                          <button onClick={() => copyToClipboard(txt)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                          </button>
                        </div>
                      ))}
                      {dnsData.dns.txt.length > 3 && (
                        <button
                          onClick={() => setShowAllTxt(!showAllTxt)}
                          className="text-sm text-palette-primary hover:text-palette-primary font-medium mt-2 w-full text-center"
                        >
                          {showAllTxt ? 'Show Less' : `Show All (${dnsData.dns.txt.length} records)`}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg p-4 border border-orange-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    SOA Record
                  </h3>
                  {dnsData.dns.soa ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">Found</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.soa ? (
                    <>
                      <div className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-orange-100">
                        <div className="text-xs text-slate-600">Primary NS</div>
                        <code className="text-sm text-slate-700 font-mono">{dnsData.dns.soa.nsname}</code>
                        <button onClick={() => copyToClipboard(dnsData.dns.soa?.nsname || '')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-orange-100">
                        <div className="text-xs text-slate-600">Admin</div>
                        <code className="text-sm text-slate-700 font-mono">{dnsData.dns.soa.hostmaster}</code>
                        <button onClick={() => copyToClipboard(dnsData.dns.soa?.hostmaster || '')} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded px-3 py-2 border border-orange-100">
                        <div className="text-xs text-slate-600">Serial</div>
                        <code className="text-sm text-slate-700 font-mono">{dnsData.dns.soa.serial}</code>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg p-4 border border-indigo-200/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    CNAME Records
                  </h3>
                  {dnsData.dns.cname.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dnsData.dns.cname.length} records
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.cname.length > 0 ? (
                    dnsData.dns.cname.map((cname, i) => (
                      <div key={i} className="flex items-center justify-between group bg-white rounded px-3 py-2 border border-indigo-100">
                        <code className="text-sm text-slate-700 font-mono">{cname}</code>
                        <button onClick={() => copyToClipboard(cname)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-lg p-4 border border-teal-200/50 md:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Server className="h-4 w-4 text-teal-600" />
                    SRV Records
                  </h3>
                  {dnsData.dns.srv.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {dnsData.dns.srv.length} services
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200">None</Badge>
                  )}
                </div>
                <div className="space-y-2">
                  {dnsData.dns.srv.length > 0 ? (
                    dnsData.dns.srv.map((srv, i) => (
                      <div key={i} className="bg-white rounded px-4 py-3 border border-teal-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-xs text-slate-600">Service</div>
                            <code className="text-slate-700 font-mono">{srv.name}</code>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Target</div>
                            <code className="text-slate-700 font-mono">{srv.target}:{srv.port}</code>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Priority</div>
                            <code className="text-slate-700 font-mono">{srv.priority}</code>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">Weight</div>
                            <code className="text-slate-700 font-mono">{srv.weight}</code>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-2">None</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


