"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Mail, 
  Lock, 
  Key, 
  Monitor, 
  Settings, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Users
} from "lucide-react";
import { applyTheme, LAYOUT } from "@/lib/theme";
import { usePermissions } from "@/hooks/use-permissions";
import axios from "axios";
import { toast } from "sonner";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

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
const makeAuthenticatedRequest = async (url: string, method: string = 'GET', data?: any) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw new Error("No access token available");
  }

  const config: any = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  try {
    if (method === 'GET') {
      return await axios.get(url, config);
    } else if (method === 'POST') {
      return await axios.post(url, data, config);
    } else if (method === 'PUT') {
      return await axios.put(url, data, config);
    } else if (method === 'DELETE') {
      return await axios.delete(url, config);
    }
  } catch (err: any) {
    if (err.response?.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        if (method === 'GET') {
          return await axios.get(url, config);
        } else if (method === 'POST') {
          return await axios.post(url, data, config);
        } else if (method === 'PUT') {
          return await axios.put(url, data, config);
        } else if (method === 'DELETE') {
          return await axios.delete(url, config);
        }
      }
      throw err;
    }
    throw err;
  }
};

interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  is_active: boolean;
  last_login: string;
}

interface SecurityStats {
  total_users: number;
  verified_emails: number;
  two_factor_enabled: number;
  active_sessions: number;
}

export default function SecurityPage() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("email-password");

  // Check permission before loading
  useEffect(() => {
    if (!hasPermission('users.view')) {
      setError("You don't have permission to access this page. Admin access required.");
      setLoading(false);
      return;
    }
    fetchData();
  }, [hasPermission]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/workspace/login");
        return;
      }

      // Fetch users list
      const usersResponse = await makeAuthenticatedRequest(`${API_BASE}/api/users/`);
      setUsers(usersResponse.data);

      // Calculate stats
      const statsData: SecurityStats = {
        total_users: usersResponse.data.length,
        verified_emails: usersResponse.data.filter((u: User) => u.email_verified).length,
        two_factor_enabled: usersResponse.data.filter((u: User) => u.two_factor_enabled).length,
        active_sessions: 0, // TODO: Implement session tracking
      };
      setStats(statsData);

      setError(null);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 403) {
        setError("You don't have permission to access this page. Admin access required.");
      } else if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/workspace/login");
      } else {
        setError("Failed to load security data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (userId: number) => {
    try {
      await makeAuthenticatedRequest(`${API_BASE}/api/admin/security/users/${userId}/verify-email/`, 'POST');
      toast.success("Email verified successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to verify email");
    }
  };

  const handleResetPassword = async (userId: number) => {
    if (!confirm("Are you sure you want to reset this user's password? They will need to set a new password on next login.")) {
      return;
    }
    try {
      await makeAuthenticatedRequest(`${API_BASE}/api/admin/security/users/${userId}/reset-password/`, 'POST');
      toast.success("Password reset successfully. User will need to set a new password.");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reset password");
    }
  };

  const handleToggle2FA = async (userId: number, enable: boolean) => {
    try {
      if (enable) {
        await makeAuthenticatedRequest(`${API_BASE}/api/admin/security/users/${userId}/enable-2fa/`, 'POST');
        toast.success("2FA enabled successfully");
      } else {
        await makeAuthenticatedRequest(`${API_BASE}/api/admin/security/users/${userId}/disable-2fa/`, 'POST');
        toast.success("2FA disabled successfully");
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${enable ? 'enable' : 'disable'} 2FA`);
    }
  };

  if (loading) {
    return (
      <div className={applyTheme.page()}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
          <span className="ml-2 text-slate-600">Loading security data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={applyTheme.page()}>
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-h4-dynamic font-bold">Security Management</h1>
        <p className="text-muted-foreground mt-1">Manage security settings, user authentication, and platform policies</p>
      </div>

      {/* Stats Cards */}
      <div className={LAYOUT.statsGrid}>
        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Total Users</p>
                <p className={`text-h2-dynamic font-bold ${applyTheme.text('primary')}`}>
                  {stats?.total_users || 0}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Verified Emails</p>
                <p className="text-h2-dynamic font-bold text-green-400">
                  {stats?.verified_emails || 0}
                </p>
              </div>
              <Mail className={`h-8 w-8 ${applyTheme.status('success')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>2FA Enabled</p>
                <p className="text-h2-dynamic font-bold text-blue-400">
                  {stats?.two_factor_enabled || 0}
                </p>
              </div>
              <Key className={`h-8 w-8 ${applyTheme.status('info')}`} />
            </div>
          </CardContent>
        </Card>

        <Card className={applyTheme.card()}>
          <CardContent className={applyTheme.cardContent()}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${applyTheme.text('secondary')}`}>Active Sessions</p>
                <p className="text-h2-dynamic font-bold text-yellow-400">
                  {stats?.active_sessions || 0}
                </p>
              </div>
              <Monitor className={`h-8 w-8 ${applyTheme.status('warning')}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className={applyTheme.card()}>
        <CardContent className={applyTheme.cardContent()}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="email-password">
                <Mail className="h-4 w-4 mr-2" />
                Email & Password
              </TabsTrigger>
              <TabsTrigger value="password-management">
                <Lock className="h-4 w-4 mr-2" />
                Password Management
              </TabsTrigger>
              <TabsTrigger value="mfa">
                <Key className="h-4 w-4 mr-2" />
                Multi-Factor Auth
              </TabsTrigger>
              <TabsTrigger value="connections">
                <Shield className="h-4 w-4 mr-2" />
                Connections
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <Monitor className="h-4 w-4 mr-2" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="admin-policy">
                <Settings className="h-4 w-4 mr-2" />
                Admin Policy
              </TabsTrigger>
            </TabsList>

            {/* Email & Password Tab */}
            <TabsContent value="email-password" className="mt-6">
              <div className="space-y-6">
                {/* Email Management Settings */}
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-2`}>
                    Email Management Settings
                  </h3>
                  <p className={`text-sm ${applyTheme.text('secondary')} mb-6`}>
                    Configure email verification, change workflows, and recovery options
                  </p>

                  <Card className={applyTheme.card()}>
                    <CardContent className={applyTheme.cardContent()}>
                      <div className="space-y-6">
                        {/* Primary Email */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Primary Email</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Allow users to set and manage their primary email address
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        {/* Verified Status */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Verified Status</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Require email verification before account activation
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Track and display email verification status for all users
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        {/* Email Change Workflow */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Email Change Workflow</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Send confirmation emails to both old and new address when email is changed
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Ensures security by notifying user of email changes on both addresses
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        {/* Email Recovery Lock Window */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Email Recovery Lock Window</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Time period during which email changes are locked after recovery request
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Prevents unauthorized email changes immediately after account recovery
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              defaultValue={24} 
                              min={1}
                              max={168}
                              className="w-24" 
                            />
                            <span className={`text-sm ${applyTheme.text('secondary')}`}>hours</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Email Deliverability & Domain Controls */}
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-2`}>
                    Email Deliverability & Domain Controls
                  </h3>
                  <p className={`text-sm ${applyTheme.text('secondary')} mb-6`}>
                    Configure email authentication and domain security for organizations
                  </p>

                  <Card className={applyTheme.card()}>
                    <CardContent className={applyTheme.cardContent()}>
                      <div className="space-y-6">
                        {/* Require DKIM */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Require DKIM (DomainKeys Identified Mail)</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Require organizations to configure DKIM for email authentication
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              DKIM verifies that emails are sent from authorized domains
                            </p>
                          </div>
                          <Switch />
                        </div>

                        {/* Require SPF */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Require SPF (Sender Policy Framework)</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Require organizations to configure SPF records for email authentication
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              SPF prevents email spoofing by specifying authorized sending servers
                            </p>
                          </div>
                          <Switch />
                        </div>

                        {/* Require DMARC */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Require DMARC (Domain-based Message Authentication)</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Require organizations to configure DMARC policy for email security
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              DMARC combines SPF and DKIM to protect against email fraud and phishing
                            </p>
                          </div>
                          <Switch />
                        </div>

                        {/* Domain Verification Status */}
                        <div className="border-t pt-4">
                          <Label className="text-base font-semibold">Domain Verification Status</Label>
                          <p className={`text-sm ${applyTheme.text('secondary')} mt-2 mb-4`}>
                            View and manage domain verification status for organizations
                          </p>
                          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                            <p className={`text-sm ${applyTheme.text('secondary')} text-center`}>
                              Domain verification dashboard coming soon
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} text-center mt-2`}>
                              Track DKIM, SPF, and DMARC configuration status per organization
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Password Management Tab */}
            <TabsContent value="password-management" className="mt-6">
              <div className="space-y-6">
                {/* Password Settings Section */}
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-2`}>
                    Password Settings
                  </h3>
                  <p className={`text-sm ${applyTheme.text('secondary')} mb-6`}>
                    Configure password validation and security requirements
                  </p>

                  <Card className={applyTheme.card()}>
                    <CardContent className={applyTheme.cardContent()}>
                      <div className="space-y-6">
                        {/* Password Strength Meter */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Password Strength Meter</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Show real-time password strength indicator to users during password creation
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        {/* Reject Blacklisted/Common Passwords */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Reject Blacklisted/Common Passwords</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Prevent users from using commonly used or compromised passwords
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Checks against Have I Been Pwned database and common password lists
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        {/* Allow Long Passphrases */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Allow Long Passphrases</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Support passphrases of 64+ characters for enhanced security
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Enables users to use long, memorable passphrases instead of complex passwords
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Password Policy Controls Per Organization */}
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-2`}>
                    Password Policy Controls (Per Organization)
                  </h3>
                  <p className={`text-sm ${applyTheme.text('secondary')} mb-6`}>
                    Configure organization-specific password requirements
                  </p>

                  <Card className={applyTheme.card()}>
                    <CardContent className={applyTheme.cardContent()}>
                      <div className="space-y-6">
                        {/* Minimum Length */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Minimum Password Length</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Require passwords to be at least this many characters
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              defaultValue={8} 
                              min={8}
                              max={64}
                              className="w-24" 
                            />
                            <span className={`text-sm ${applyTheme.text('secondary')}`}>characters</span>
                          </div>
                        </div>

                        {/* Maximum Length Acceptance */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Maximum Length Acceptance</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Allow passwords up to this length (recommended: ≥64 for passphrases)
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Set to 64 or higher to support long passphrases
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              defaultValue={64} 
                              min={64}
                              max={256}
                              className="w-24" 
                            />
                            <span className={`text-sm ${applyTheme.text('secondary')}`}>characters</span>
                          </div>
                        </div>

                        {/* Disallow Periodic Rotation */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Disallow Periodic Rotation</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Rotate passwords only on compromise, not on a schedule
                            </p>
                            <p className={`text-xs ${applyTheme.text('muted')} mt-1`}>
                              Recommended by NIST: Only require password change when there's evidence of compromise
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>

                        {/* Password History (if rotation is disabled) */}
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex-1">
                            <Label className="text-base font-semibold">Password History</Label>
                            <p className={`text-sm ${applyTheme.text('secondary')} mt-1`}>
                              Prevent reuse of last N passwords
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number" 
                              defaultValue={5} 
                              min={0}
                              max={20}
                              className="w-24" 
                            />
                            <span className={`text-sm ${applyTheme.text('secondary')}`}>previous passwords</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Save Password Policy Settings
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Multi-Factor Auth Tab */}
            <TabsContent value="mfa" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-2`}>
                    2-step verification
                  </h3>
                  <p className={`text-sm ${applyTheme.text('secondary')} mb-6`}>
                    When we need to check it's really you using your account
                  </p>
                </div>

                {/* Passkey Option */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Key className="h-5 w-5 text-blue-500" />
                          <h4 className={`font-semibold ${applyTheme.text('primary')}`}>Passkey</h4>
                        </div>
                        <p className={`text-sm ${applyTheme.text('secondary')} mb-1`}>
                          More secure • Biometrics or PIN code
                        </p>
                        <p className={`text-xs ${applyTheme.text('muted')}`}>
                          Use your device's biometric authentication or PIN to verify your identity
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Authenticator App (TOTP) Option */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Key className="h-5 w-5 text-green-500" />
                          <h4 className={`font-semibold ${applyTheme.text('primary')}`}>Authenticator app (TOTP)</h4>
                        </div>
                        <p className={`text-sm ${applyTheme.text('secondary')} mb-1`}>
                          More secure
                        </p>
                        <p className={`text-xs ${applyTheme.text('muted')}`}>
                          Use an authenticator app like Google Authenticator or Authy to generate verification codes
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Security Key Option */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Key className="h-5 w-5 text-purple-500" />
                          <h4 className={`font-semibold ${applyTheme.text('primary')}`}>Security key</h4>
                        </div>
                        <p className={`text-sm ${applyTheme.text('secondary')} mb-1`}>
                          Most secure • Physical key
                        </p>
                        <p className={`text-xs ${applyTheme.text('muted')}`}>
                          Use a physical security key like YubiKey for the highest level of security
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Trusted Contacts Option */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Users className="h-5 w-5 text-orange-500" />
                          <h4 className={`font-semibold ${applyTheme.text('primary')}`}>Trusted contacts</h4>
                        </div>
                        <p className={`text-sm ${applyTheme.text('secondary')} mb-1`}>
                          More secure • Add trusted contacts who can verify sensitive actions for you, such as account recovery
                        </p>
                        <p className={`text-xs ${applyTheme.text('muted')}`}>
                          Designate trusted contacts who can help verify your identity for account recovery
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Security Prompt Option */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Monitor className="h-5 w-5 text-indigo-500" />
                          <h4 className={`font-semibold ${applyTheme.text('primary')}`}>Security prompt</h4>
                        </div>
                        <p className={`text-sm ${applyTheme.text('secondary')} mb-1`}>
                          More secure • Push notification
                        </p>
                        <p className={`text-xs ${applyTheme.text('muted')}`}>
                          Receive push notifications on your trusted devices to approve login attempts
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-2`}>
                    Social Login Connections
                  </h3>
                  <p className={`text-sm ${applyTheme.text('secondary')} mb-6`}>
                    Enable or disable account login through third-party providers
                  </p>
                </div>

                {/* Google Connection */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                          <span className="text-h3-dynamic font-bold text-blue-600">G</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${applyTheme.text('primary')} mb-1`}>Google</h4>
                          <p className={`text-sm ${applyTheme.text('secondary')}`}>
                            Allow users to sign in with their Google account
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Apple ID Connection */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                          <span className="text-h3-dynamic font-bold text-white">🍎</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${applyTheme.text('primary')} mb-1`}>Apple ID</h4>
                          <p className={`text-sm ${applyTheme.text('secondary')}`}>
                            Allow users to sign in with their Apple ID
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Facebook Connection */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-h3-dynamic font-bold text-white">f</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${applyTheme.text('primary')} mb-1`}>Facebook</h4>
                          <p className={`text-sm ${applyTheme.text('secondary')}`}>
                            Allow users to sign in with their Facebook account
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* GitHub Connection */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <span className="text-h3-dynamic font-bold text-white">G</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${applyTheme.text('primary')} mb-1`}>GitHub</h4>
                          <p className={`text-sm ${applyTheme.text('secondary')}`}>
                            Allow users to sign in with their GitHub account
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* Microsoft Connection */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-h3-dynamic font-bold text-white">M</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${applyTheme.text('primary')} mb-1`}>Microsoft</h4>
                          <p className={`text-sm ${applyTheme.text('secondary')}`}>
                            Allow users to sign in with their Microsoft account
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                {/* LinkedIn Connection */}
                <Card className={applyTheme.card()}>
                  <CardContent className={applyTheme.cardContent()}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center">
                          <span className="text-h3-dynamic font-bold text-white">in</span>
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${applyTheme.text('primary')} mb-1`}>LinkedIn</h4>
                          <p className={`text-sm ${applyTheme.text('secondary')}`}>
                            Allow users to sign in with their LinkedIn account
                          </p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')}`}>
                    Active Sessions
                  </h3>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                <div className="text-center py-8 text-slate-500">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p>Session management coming soon</p>
                  <p className="text-sm mt-2">Track and manage active user sessions across devices</p>
                </div>
              </div>
            </TabsContent>

            {/* Admin Policy Tab */}
            <TabsContent value="admin-policy" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className={`text-h4-dynamic font-semibold ${applyTheme.text('primary')} mb-4`}>
                    Security Policy Configuration
                  </h3>
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h4 className={`font-semibold ${applyTheme.text('primary')} mb-4`}>
                        Authentication Policies
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Session Timeout</Label>
                            <p className="text-sm text-slate-500">Auto-logout after inactivity (minutes)</p>
                          </div>
                          <Input type="number" defaultValue={30} className="w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Max Concurrent Sessions</Label>
                            <p className="text-sm text-slate-500">Limit number of simultaneous logins per user</p>
                          </div>
                          <Input type="number" defaultValue={5} className="w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Account Lockout Threshold</Label>
                            <p className="text-sm text-slate-500">Lock account after failed login attempts</p>
                          </div>
                          <Input type="number" defaultValue={5} className="w-24" />
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className={`font-semibold ${applyTheme.text('primary')} mb-4`}>
                        Security Notifications
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Email Security Alerts</Label>
                            <p className="text-sm text-slate-500">Send email notifications for security events</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Failed Login Alerts</Label>
                            <p className="text-sm text-slate-500">Notify admins of suspicious login attempts</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Password Change Alerts</Label>
                            <p className="text-sm text-slate-500">Notify users when password is changed</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Save Policy Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

