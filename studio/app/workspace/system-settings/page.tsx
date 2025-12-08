"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Settings, BarChart3, Bell, Save, Database, Globe, Lock } from "lucide-react";
import { applyTheme, LAYOUT, getCurrentTheme, setTheme, type ThemeVariant } from "@/lib/theme";
import axios from "axios";
import { toast } from "sonner";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function AdminSettingsPage() {
  const currentTheme = getCurrentTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteConfig, setSiteConfig] = useState({
    enable_two_factor: false,  // Default: OFF
    enable_email_verification: false,
    require_strong_passwords: true,
    enable_analytics: false,
  });

  useEffect(() => {
    fetchSiteConfig();
  }, []);

  const fetchSiteConfig = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/api/site-config/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSiteConfig({
        enable_two_factor: res.data.enable_two_factor ?? false,
        enable_email_verification: res.data.enable_email_verification ?? false,
        require_strong_passwords: res.data.require_strong_passwords ?? false,
        enable_analytics: res.data.enable_analytics ?? false,
      });
    } catch (err) {
      console.error("Failed to fetch site config:", err);
      toast.error("Failed to load site configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please log in to save settings");
      return;
    }

    setSaving(true);
    try {
      await axios.patch(
        `${API_BASE}/api/site-config/update/`,
        siteConfig,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (theme: ThemeVariant) => {
    setTheme(theme);
    // Force a re-render by updating the page
    window.location.reload();
  };

  return (
    <div className={applyTheme.page()}>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* General Settings */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`flex items-center ${applyTheme.text('primary')}`}>
              <Settings className="h-5 w-5 mr-2 text-blue-600" />
              General Settings
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Basic application configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="app-name" className={applyTheme.text('label')}>Application Name</Label>
                <Input
                  id="app-name"
                  type="text"
                  defaultValue="PageRodeo Admin"
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>
              <div>
                <Label htmlFor="language" className={applyTheme.text('label')}>Default Language</Label>
                <select 
                  id="language"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="description" className={applyTheme.text('label')}>Application Description</Label>
              <textarea
                id="description"
                rows={3}
                defaultValue="A comprehensive web performance monitoring and analysis platform"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="theme" className={applyTheme.text('label')}>Theme Preference</Label>
              <div className="flex space-x-4 mt-2">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    currentTheme === 'light' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    currentTheme === 'dark' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange('auto')}
                  className={`px-4 py-2 rounded-md border transition-colors ${
                    localStorage.getItem('pagerodeo-theme') === 'auto' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Auto
                </button>
              </div>
              <p className={`text-sm ${applyTheme.text('secondary')} mt-2`}>
                Current theme: {currentTheme} {localStorage.getItem('pagerodeo-theme') === 'auto' && '(system)'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`flex items-center ${applyTheme.text('primary')}`}>
              <Shield className="h-5 w-5 mr-2 text-red-600" />
              Security Settings
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Configure security and authentication options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session-timeout" className={applyTheme.text('label')}>Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  defaultValue="30"
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>
              <div>
                <Label htmlFor="max-attempts" className={applyTheme.text('label')}>Max Login Attempts</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  defaultValue="5"
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="strong-passwords" className={applyTheme.text('label')}>Require strong passwords</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Enforce password complexity requirements</p>
                </div>
                <Switch 
                  id="strong-passwords" 
                  checked={siteConfig.require_strong_passwords}
                  onCheckedChange={(checked) => setSiteConfig({ ...siteConfig, require_strong_passwords: checked })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor" className={applyTheme.text('label')}>Enable two-factor authentication</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Require 2FA for all admin accounts (Future feature)</p>
                </div>
                <Switch 
                  id="two-factor" 
                  checked={siteConfig.enable_two_factor}
                  onCheckedChange={(checked) => setSiteConfig({ ...siteConfig, enable_two_factor: checked })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-verification" className={applyTheme.text('label')}>Enable email verification</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Verify email addresses on registration</p>
                </div>
                <Switch 
                  id="email-verification" 
                  checked={siteConfig.enable_email_verification}
                  onCheckedChange={(checked) => setSiteConfig({ ...siteConfig, enable_email_verification: checked })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-analytics" className={applyTheme.text('label')}>Enable analytics (PostHog)</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Allow client-side analytics in production</p>
                </div>
                <Switch 
                  id="enable-analytics" 
                  checked={siteConfig.enable_analytics}
                  onCheckedChange={(checked) => setSiteConfig({ ...siteConfig, enable_analytics: checked })}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`flex items-center ${applyTheme.text('primary')}`}>
              <Bell className="h-5 w-5 mr-2 text-yellow-600" />
              Notification Settings
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Configure system notifications and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className={applyTheme.text('label')}>Email notifications</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Send notifications via email</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications" className={applyTheme.text('label')}>Push notifications</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Send browser push notifications</p>
                </div>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications" className={applyTheme.text('label')}>SMS notifications</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Send notifications via SMS</p>
                </div>
                <Switch id="sms-notifications" />
              </div>
            </div>
            <div>
              <Label htmlFor="notification-email" className={applyTheme.text('label')}>Notification Email</Label>
              <Input
                id="notification-email"
                type="email"
                defaultValue="admin@pagerodeo.com"
                className="bg-white border-slate-300 text-slate-800"
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`flex items-center ${applyTheme.text('primary')}`}>
              <Database className="h-5 w-5 mr-2 text-green-600" />
              Database Settings
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Database configuration and maintenance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="db-type" className={applyTheme.text('label')}>Database Type</Label>
                <select 
                  id="db-type"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>
              <div>
                <Label htmlFor="backup-frequency" className={applyTheme.text('label')}>Backup Frequency</Label>
                <select 
                  id="backup-frequency"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Test Connection
              </Button>
              <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-100">
                Create Backup
              </Button>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                Reset Database
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card className={applyTheme.card()}>
          <CardHeader>
            <CardTitle className={`flex items-center ${applyTheme.text('primary')}`}>
              <Globe className="h-5 w-5 mr-2 text-palette-primary" />
              API Settings
            </CardTitle>
            <CardDescription className={applyTheme.text('secondary')}>
              Configure API endpoints and external services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api-base-url" className={applyTheme.text('label')}>API Base URL</Label>
                <Input
                  id="api-base-url"
                  type="url"
                  defaultValue="https://api.pagerodeo.com"
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>
              <div>
                <Label htmlFor="rate-limit" className={applyTheme.text('label')}>Rate Limit (requests/minute)</Label>
                <Input
                  id="rate-limit"
                  type="number"
                  defaultValue="1000"
                  className="bg-white border-slate-300 text-slate-800"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cors-enabled" className={applyTheme.text('label')}>Enable CORS</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Allow cross-origin requests</p>
                </div>
                <Switch id="cors-enabled" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="api-docs" className={applyTheme.text('label')}>Enable API Documentation</Label>
                  <p className={`text-sm ${applyTheme.text('secondary')}`}>Expose API documentation endpoint</p>
                </div>
                <Switch id="api-docs" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleSaveSettings}
            disabled={loading || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
