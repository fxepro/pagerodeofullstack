"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, RefreshCw } from 'lucide-react';

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface UserSettings {
  // Monitoring settings
  homepageCheckInterval: number; // in minutes
  internalPagesCheckInterval: number; // in hours
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  
  // Site Audit settings
  autoRunAudit: boolean;
  auditDepth: number;
  
  // General preferences
  timezone: string;
  dateFormat: string;
  itemsPerPage: number;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    homepageCheckInterval: 5, // minutes
    internalPagesCheckInterval: 1, // hours
    enableEmailNotifications: true,
    enableSmsNotifications: false,
    autoRunAudit: false,
    auditDepth: 3,
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    itemsPerPage: 25,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/user/settings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Migrate old defaultCheckInterval to new fields if needed (if coming from localStorage fallback)
        if (data.defaultCheckInterval && !data.homepageCheckInterval) {
          data.homepageCheckInterval = data.defaultCheckInterval;
          data.internalPagesCheckInterval = 1; // default to 1 hour
          delete data.defaultCheckInterval;
        }
        setSettings({ ...settings, ...data });
      } else if (response.status === 401) {
        // Token expired - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = `/login?error=${encodeURIComponent('Your session has expired. Please log in again.')}`;
        return;
      } else {
        // If API fails, try localStorage as fallback (for migration)
        const saved = localStorage.getItem('user_settings');
        if (saved) {
          try {
            const savedSettings = JSON.parse(saved);
            // Migrate old defaultCheckInterval to new fields if needed
            if (savedSettings.defaultCheckInterval && !savedSettings.homepageCheckInterval) {
              savedSettings.homepageCheckInterval = savedSettings.defaultCheckInterval;
              savedSettings.internalPagesCheckInterval = 1;
              delete savedSettings.defaultCheckInterval;
            }
            setSettings({ ...settings, ...savedSettings });
          } catch (parseErr) {
            console.error('Error parsing localStorage settings:', parseErr);
          }
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      // Fallback to localStorage if network error
      try {
        const saved = localStorage.getItem('user_settings');
        if (saved) {
          const savedSettings = JSON.parse(saved);
          if (savedSettings.defaultCheckInterval && !savedSettings.homepageCheckInterval) {
            savedSettings.homepageCheckInterval = savedSettings.defaultCheckInterval;
            savedSettings.internalPagesCheckInterval = 1;
            delete savedSettings.defaultCheckInterval;
          }
          setSettings({ ...settings, ...savedSettings });
        }
      } catch (fallbackErr) {
        console.error('Error loading from localStorage:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      toast.error('Please log in to save settings');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/user/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      const data = await response.json();
      setSettings(data);
      toast.success('Settings saved successfully');
      
      // Also save to localStorage as backup
      localStorage.setItem('user_settings', JSON.stringify(data));
    } catch (err: any) {
      console.error('Error saving settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-palette-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-palette-primary hover:bg-palette-primary-hover"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Monitoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Settings</CardTitle>
          <CardDescription>Configure how sites are monitored</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="homepageCheckInterval">Homepage Check Interval (minutes)</Label>
            <Input
              id="homepageCheckInterval"
              type="number"
              min="1"
              max="60"
              value={settings.homepageCheckInterval}
              onChange={(e) => updateSetting('homepageCheckInterval', parseInt(e.target.value) || 5)}
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">How often to check homepage status (1-60 minutes)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalPagesCheckInterval">Internal Pages Check Interval (hours)</Label>
            <Input
              id="internalPagesCheckInterval"
              type="number"
              min="1"
              max="24"
              value={settings.internalPagesCheckInterval}
              onChange={(e) => updateSetting('internalPagesCheckInterval', parseInt(e.target.value) || 1)}
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">How often to check internal pages status (1-24 hours)</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-slate-500">Receive email alerts when sites go down</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.enableEmailNotifications}
              onCheckedChange={(checked) => updateSetting('enableEmailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <p className="text-sm text-slate-500">Receive SMS alerts for critical issues</p>
            </div>
            <Switch
              id="smsNotifications"
              checked={settings.enableSmsNotifications}
              onCheckedChange={(checked) => updateSetting('enableSmsNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Site Audit Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Site Audit Settings</CardTitle>
          <CardDescription>Configure site audit behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoRunAudit">Auto-run Audit</Label>
              <p className="text-sm text-slate-500">Automatically run audit when adding a new site</p>
            </div>
            <Switch
              id="autoRunAudit"
              checked={settings.autoRunAudit}
              onCheckedChange={(checked) => updateSetting('autoRunAudit', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="auditDepth">Audit Depth</Label>
            <Input
              id="auditDepth"
              type="number"
              min="1"
              max="10"
              value={settings.auditDepth}
              onChange={(e) => updateSetting('auditDepth', parseInt(e.target.value) || 3)}
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">How deep to crawl pages during audit (1-10 levels)</p>
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>General Preferences</CardTitle>
          <CardDescription>Personalize your experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              type="text"
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              placeholder="UTC"
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">Your timezone (e.g., UTC, America/New_York)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Input
              id="dateFormat"
              type="text"
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
              placeholder="YYYY-MM-DD"
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">Preferred date format</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemsPerPage">Items Per Page</Label>
            <Input
              id="itemsPerPage"
              type="number"
              min="10"
              max="100"
              value={settings.itemsPerPage}
              onChange={(e) => updateSetting('itemsPerPage', parseInt(e.target.value) || 25)}
              className="max-w-xs"
            />
            <p className="text-xs text-slate-500">Number of items to display per page (10-100)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

