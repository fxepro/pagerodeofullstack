"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  User,
  Mail,
  Lock,
  Save,
  Building2,
  CreditCard,
  Banknote,
  Trash2,
  Edit,
  RefreshCw,
  DollarSign,
  CalendarRange,
  Repeat,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

interface UserInfo {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

interface CorporateInfo {
  company_name: string;
  job_title: string;
  phone: string;
  website: string;
  tax_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  notes: string;
}

interface PaymentMethod {
  id: number;
  nickname: string;
  method_type: "card" | "ach";
  brand?: string;
  last4?: string;
  exp_month?: number | null;
  exp_year?: number | null;
  bank_name?: string;
  account_type?: string;
  routing_last4?: string;
  is_default: boolean;
  created_at: string;
}

interface Subscription {
  id: number;
  plan_name: string;
  role: string;
  start_date: string;
  end_date: string | null;
  is_recurring: boolean;
  status: string;
  notes: string;
  created_at: string;
}

interface BillingTransaction {
  id: number;
  amount: string;
  currency: string;
  description: string;
  invoice_id: string;
  status: string;
  created_at: string;
}

const emptyCorporate: CorporateInfo = {
  company_name: "",
  job_title: "",
  phone: "",
  website: "",
  tax_id: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  notes: "",
};

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [corporateInfo, setCorporateInfo] = useState<CorporateInfo>(emptyCorporate);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCorporate, setSavingCorporate] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentsRefreshing, setPaymentsRefreshing] = useState(false);
  const [addingSubscription, setAddingSubscription] = useState(false);
  const [addingTransaction, setAddingTransaction] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);

  // Personal info fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Payment form state
  const [newPayment, setNewPayment] = useState({
    method_type: "card" as "card" | "ach",
    nickname: "",
    brand: "",
    last4: "",
    exp_month: "",
    exp_year: "",
    bank_name: "",
    account_type: "checking",
    routing_last4: "",
    is_default: false,
  });

  // Subscription form state
  const [newSubscription, setNewSubscription] = useState({
    plan_name: "Auditor",
    role: "Auditor",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    is_recurring: true,
    notes: "",
  });

  // Manual transaction form
  const [newTransaction, setNewTransaction] = useState({
    amount: "",
    currency: "USD",
    description: "",
    invoice_id: "",
  });

  // Error buckets
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [corporateError, setCorporateError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);

  const authHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
    } as HeadersInit;
  };

  const ensureAuth = () => {
    const headers = authHeaders();
    if (!headers) {
      setProfileError("Not authenticated. Please log in.");
      setLoading(false);
    }
    return headers;
  };

  const formatCurrency = (amount: string, currency: string) => {
    const value = parseFloat(amount);
    if (isNaN(value)) return `${amount} ${currency}`;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  };

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const paymentStats = useMemo(() => {
    const defaultMethod = paymentMethods.find(pm => pm.is_default);
    const cardCount = paymentMethods.filter(pm => pm.method_type === "card").length;
    const achCount = paymentMethods.filter(pm => pm.method_type === "ach").length;

    let defaultLabel = "Not set";
    if (defaultMethod) {
      defaultLabel = defaultMethod.method_type === "card"
        ? `${defaultMethod.brand || "Card"} •••• ${defaultMethod.last4}`
        : `${defaultMethod.bank_name || "Bank"} •••• ${defaultMethod.last4}`;
    }

    return {
      total: paymentMethods.length,
      cardCount,
      achCount,
      defaultLabel,
    };
  }, [paymentMethods]);

  useEffect(() => {
    const headers = ensureAuth();
    if (!headers) return;

    const loadAll = async () => {
      try {
        await Promise.all([
          fetchUserInfo(headers),
          fetchCorporateInfo(headers),
          fetchPaymentMethods(headers),
          fetchSubscriptions(headers),
          fetchBillingHistory(headers),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUserInfo(headers: HeadersInit) {
    setProfileError(null);
    try {
      const response = await fetch(`${API_BASE}/api/user-info/`, { headers });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setProfileError("Session expired. Please log in again.");
          window.location.href = "/login";
          return;
        }
        throw new Error(`Failed to fetch user info (${response.status})`);
      }

      const data = await response.json();
      setUser(data);
      setEmail(data.email || "");
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
    } catch (error: any) {
      console.error("Error fetching user info:", error);
      setProfileError(error.message || "Failed to load profile information");
    }
  }

  async function fetchCorporateInfo(headers: HeadersInit) {
    setCorporateError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profile/corporate/`, { headers });
      if (response.ok) {
        const data = await response.json();
        setCorporateInfo({ ...emptyCorporate, ...data });
      } else if (response.status !== 404) {
        throw new Error(`Failed to load corporate info (${response.status})`);
      }
    } catch (error: any) {
      console.error("Error loading corporate info:", error);
      setCorporateError(error.message || "Unable to load corporate details");
    }
  }

  async function fetchPaymentMethods(headers: HeadersInit) {
    setPaymentsError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profile/payment-methods/`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to load payment methods (${response.status})`);
      }
      const data = await response.json();
      setPaymentMethods(data);
      if (data.length === 0) {
        setNewPayment(prev => ({ ...prev, is_default: true }));
      }
    } catch (error: any) {
      console.error("Error loading payment methods:", error);
      setPaymentsError(error.message || "Unable to load payment methods");
    }
  }

  async function fetchSubscriptions(headers: HeadersInit) {
    setSubscriptionError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profile/subscriptions/`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to load subscriptions (${response.status})`);
      }
      const data = await response.json();
      setSubscriptions(data);
    } catch (error: any) {
      console.error("Error loading subscriptions:", error);
      setSubscriptionError(error.message || "Unable to load subscriptions");
    }
  }

  async function fetchBillingHistory(headers: HeadersInit) {
    setBillingError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profile/billing-history/`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to load billing history (${response.status})`);
      }
      const data = await response.json();
      setBillingHistory(data);
    } catch (error: any) {
      console.error("Error loading billing history:", error);
      setBillingError(error.message || "Unable to load billing history");
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    setProfileError(null);

    try {
      const headers = authHeaders();
      if (!headers) {
        setProfileError("Not authenticated. Please log in.");
        setSavingProfile(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/update/`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update profile (${response.status})`);
      }

      const updatedData = await response.json();
      setUser(updatedData);
      setEditMode(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setProfileError(error.message || "Failed to update profile");
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const headers = authHeaders();
      if (!headers) {
        setPasswordError("Not authenticated. Please log in.");
        setChangingPassword(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/change-password/`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to change password (${response.status})`);
      }

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMode(false);
      toast.success("Password changed successfully");
    } catch (error: any) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Failed to change password");
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSaveCorporateInfo() {
    setSavingCorporate(true);
    setCorporateError(null);

    try {
      const headers = authHeaders();
      if (!headers) {
        setCorporateError("Not authenticated. Please log in.");
        setSavingCorporate(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/corporate/`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corporateInfo),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update corporate info (${response.status})`);
      }

      const data = await response.json();
      setCorporateInfo({ ...emptyCorporate, ...data });
      toast.success("Corporate information updated");
    } catch (error: any) {
      console.error("Error saving corporate info:", error);
      setCorporateError(error.message || "Failed to update corporate info");
      toast.error(error.message || "Failed to update corporate info");
    } finally {
      setSavingCorporate(false);
    }
  }

  async function handleAddPaymentMethod() {
    setPaymentsError(null);

    if (newPayment.method_type === "card") {
      if (!newPayment.brand || !newPayment.last4 || !newPayment.exp_month || !newPayment.exp_year) {
        setPaymentsError("Please complete all card details");
        return;
      }
      if (newPayment.last4.length !== 4) {
        setPaymentsError("Enter last 4 digits of the card");
        return;
      }
    } else {
      if (!newPayment.bank_name || !newPayment.last4) {
        setPaymentsError("Please provide bank name and last 4 digits");
        return;
      }
    }

    setAddingPayment(true);

    try {
      const headers = authHeaders();
      if (!headers) {
        setPaymentsError("Not authenticated. Please log in.");
        setAddingPayment(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/payment-methods/`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPayment),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to add payment method (${response.status})`);
      }

      const created = await response.json();
      setPaymentMethods(prev => [created, ...prev.filter(pm => pm.id !== created.id)]);
      toast.success("Payment method added");
      setNewPayment({
        method_type: "card",
        nickname: "",
        brand: "",
        last4: "",
        exp_month: "",
        exp_year: "",
        bank_name: "",
        account_type: "checking",
        routing_last4: "",
        is_default: false,
      });
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      setPaymentsError(error.message || "Failed to add payment method");
      toast.error(error.message || "Failed to add payment method");
    } finally {
      setAddingPayment(false);
    }
  }

  async function handleDeletePaymentMethod(id: number) {
    setPaymentsError(null);

    try {
      const headers = authHeaders();
      if (!headers) {
        setPaymentsError("Not authenticated. Please log in.");
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/payment-methods/${id}/`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete payment method (${response.status})`);
      }

      toast.success("Payment method removed");
      fetchPaymentMethods(headers);
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      setPaymentsError(error.message || "Failed to delete payment method");
    }
  }

  async function handleSetDefaultPayment(id: number, isDefault: boolean) {
    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/api/profile/payment-methods/${id}/`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_default: isDefault }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update payment method (${response.status})`);
      }

      const updated = await response.json();
      setPaymentMethods(prev =>
        prev
          .map(pm => (pm.id === updated.id ? updated : { ...pm, is_default: pm.id === updated.id ? updated.is_default : false }))
          .sort((a, b) => (a.is_default === b.is_default ? 0 : a.is_default ? -1 : 1))
      );
      toast.success("Default payment method updated");
    } catch (error: any) {
      console.error("Error updating payment method:", error);
      setPaymentsError(error.message || "Failed to update payment method");
    }
  }

  async function handleAddSubscription() {
    setSubscriptionError(null);

    if (!newSubscription.plan_name || !newSubscription.start_date) {
      setSubscriptionError("Plan name and start date are required");
      return;
    }

    setAddingSubscription(true);

    try {
      const headers = authHeaders();
      if (!headers) {
        setSubscriptionError("Not authenticated. Please log in.");
        setAddingSubscription(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/subscriptions/`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSubscription),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create subscription (${response.status})`);
      }

      const created = await response.json();
      setSubscriptions(prev => [created, ...prev]);
      toast.success("Subscription added");
      setNewSubscription({
        plan_name: "Auditor",
        role: "Auditor",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: "",
        is_recurring: true,
        notes: "",
      });
    } catch (error: any) {
      console.error("Error adding subscription:", error);
      setSubscriptionError(error.message || "Failed to add subscription");
      toast.error(error.message || "Failed to add subscription");
    } finally {
      setAddingSubscription(false);
    }
  }

  async function handleCancelSubscription(id: number) {
    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/api/profile/subscriptions/${id}/`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to cancel subscription (${response.status})`);
      }

      toast.success("Subscription cancelled");
      fetchSubscriptions(headers);
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      setSubscriptionError(error.message || "Failed to cancel subscription");
    }
  }

  async function handleToggleSubscriptionRecurring(id: number, isRecurring: boolean) {
    try {
      const headers = authHeaders();
      if (!headers) return;

      const response = await fetch(`${API_BASE}/api/profile/subscriptions/${id}/`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_recurring: isRecurring }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update subscription (${response.status})`);
      }

      const updated = await response.json();
      setSubscriptions(prev => prev.map(sub => (sub.id === updated.id ? updated : sub)));
      toast.success("Subscription updated");
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      setSubscriptionError(error.message || "Failed to update subscription");
    }
  }

  async function handleAddTransaction() {
    setBillingError(null);

    if (!newTransaction.amount) {
      setBillingError("Amount is required");
      return;
    }

    setAddingTransaction(true);

    try {
      const headers = authHeaders();
      if (!headers) {
        setBillingError("Not authenticated. Please log in.");
        setAddingTransaction(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/profile/billing-history/`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTransaction),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to record transaction (${response.status})`);
      }

      const created = await response.json();
      setBillingHistory(prev => [created, ...prev]);
      toast.success("Transaction recorded");
      setNewTransaction({ amount: "", currency: "USD", description: "", invoice_id: "" });
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      setBillingError(error.message || "Failed to record transaction");
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setAddingTransaction(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-palette-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
        <p className="text-red-600">{profileError || "Failed to load profile"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-palette-accent-3/60">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-palette-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your basic account information</CardDescription>
                </div>
                {!editMode && (
                  <Button
                    onClick={() => setEditMode(true)}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileError && !editMode && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={user.username} disabled className="bg-slate-50" />
                  <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-palette-primary text-white capitalize">{user.role}</Badge>
                    {user.is_active && (
                      <Badge className="bg-green-100 text-green-700 border border-green-200">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  {editMode ? (
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{user.email || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  {editMode ? (
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{user.first_name || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  {editMode ? (
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{user.last_name || "Not set"}</p>
                  )}
                </div>
              </div>

              {editMode && (
                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-palette-primary hover:bg-palette-primary-hover"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditMode(false);
                      setEmail(user.email || "");
                      setFirstName(user.first_name || "");
                      setLastName(user.last_name || "");
                      setProfileError(null);
                    }}
                    variant="outline"
                    disabled={savingProfile}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-palette-primary" />
                Corporate Information
              </CardTitle>
              <CardDescription>Keep your organisation details current</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {corporateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{corporateError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={corporateInfo.company_name}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, company_name: e.target.value }))}
                    className="mt-1"
                    placeholder="Company or organisation"
                  />
                </div>

                <div>
                  <Label htmlFor="job_title">Title / Department</Label>
                  <Input
                    id="job_title"
                    value={corporateInfo.job_title}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, job_title: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={corporateInfo.phone}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={corporateInfo.website}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, website: e.target.value }))}
                    className="mt-1"
                    placeholder="https://"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_id">Tax ID / VAT</Label>
                  <Input
                    id="tax_id"
                    value={corporateInfo.tax_id}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={corporateInfo.country}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, country: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    value={corporateInfo.address_line1}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, address_line1: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    value={corporateInfo.address_line2}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, address_line2: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={corporateInfo.city}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, city: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    value={corporateInfo.state}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, state: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={corporateInfo.postal_code}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={corporateInfo.notes}
                  onChange={(e) => setCorporateInfo(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                  placeholder="Internal notes or billing instructions"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveCorporateInfo}
                  disabled={savingCorporate}
                  className="bg-palette-primary hover:bg-palette-primary-hover"
                >
                  {savingCorporate ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Corporate Info
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setCorporateInfo(emptyCorporate);
                    const headers = authHeaders();
                    if (headers) {
                      fetchCorporateInfo(headers);
                    }
                  }}
                  variant="outline"
                  disabled={savingCorporate}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-palette-primary" />
                    Security
                  </CardTitle>
                  <CardDescription>Change your account password</CardDescription>
                </div>
                {!passwordMode && (
                  <Button
                    onClick={() => setPasswordMode(true)}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    Change Password
                  </Button>
                )}
              </div>
            </CardHeader>
            {passwordMode && (
              <CardContent className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 text-sm">{passwordError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-palette-primary hover:bg-palette-primary-hover"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setPasswordMode(false);
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                    }}
                    variant="outline"
                    disabled={changingPassword}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="financials" className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-xl border border-white/20 p-6">
            <div className="flex flex-wrap items-center gap-8">
              <div className="min-w-[180px]">
                <p className="text-sm uppercase tracking-wide text-white/70">Default Method</p>
                <p className="text-lg font-semibold mt-1">{paymentStats.defaultLabel}</p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-white/70">Total Methods</p>
                  <p className="mt-1 text-2xl font-bold">{paymentStats.total}</p>
                </div>
                <div>
                  <p className="text-white/70">Cards</p>
                  <p className="mt-1 text-2xl font-bold">{paymentStats.cardCount}</p>
                </div>
                <div>
                  <p className="text-white/70">ACH Accounts</p>
                  <p className="mt-1 text-2xl font-bold">{paymentStats.achCount}</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription className="text-slate-500">Manage cards and ACH accounts for billing</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = authHeaders();
                    if (headers) {
                      setPaymentsRefreshing(true);
                      fetchPaymentMethods(headers).finally(() => setPaymentsRefreshing(false));
                    }
                  }}
                  disabled={paymentsRefreshing}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${paymentsRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{paymentsError}</span>
                </div>
              )}

              <div className="border border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Method Type</Label>
                    <Select
                      value={newPayment.method_type}
                      onValueChange={(value: "card" | "ach") =>
                        setNewPayment(prev => ({
                          method_type: value,
                          nickname: prev.nickname,
                          brand: "",
                          last4: "",
                          exp_month: "",
                          exp_year: "",
                          bank_name: "",
                          account_type: "checking",
                          routing_last4: "",
                          is_default: prev.is_default,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1 w-full md:w-64">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">Credit / Debit Card</SelectItem>
                        <SelectItem value="ach">Bank Transfer (ACH)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="nickname">Label</Label>
                    <Input
                      id="nickname"
                      value={newPayment.nickname}
                      onChange={(e) => setNewPayment(prev => ({ ...prev, nickname: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g. Corporate Visa"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_default"
                      checked={newPayment.is_default}
                      onCheckedChange={(checked) => setNewPayment(prev => ({ ...prev, is_default: checked }))}
                    />
                    <div>
                      <Label htmlFor="is_default" className="cursor-pointer">Set as default</Label>
                      <p className="text-xs text-slate-500">Default method will be billed automatically</p>
                    </div>
                  </div>

                  {newPayment.method_type === "card" ? (
                    <>
                      <div>
                        <Label htmlFor="brand">Card Brand</Label>
                        <Input
                          id="brand"
                          value={newPayment.brand}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, brand: e.target.value }))}
                          className="mt-1"
                          placeholder="Visa, Mastercard"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card_last4">Last 4 digits</Label>
                        <Input
                          id="card_last4"
                          value={newPayment.last4}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, last4: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
                          className="mt-1"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="exp_month">Expiry Month</Label>
                        <Input
                          id="exp_month"
                          value={newPayment.exp_month}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, exp_month: e.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))}
                          className="mt-1"
                          placeholder="MM"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exp_year">Expiry Year</Label>
                        <Input
                          id="exp_year"
                          value={newPayment.exp_year}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, exp_year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
                          className="mt-1"
                          placeholder="YYYY"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="bank_name">Bank Name</Label>
                        <Input
                          id="bank_name"
                          value={newPayment.bank_name}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_name: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Account Type</Label>
                        <Select
                          value={newPayment.account_type}
                          onValueChange={(value) => setNewPayment(prev => ({ ...prev, account_type: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ach_last4">Account Last 4</Label>
                        <Input
                          id="ach_last4"
                          value={newPayment.last4}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, last4: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
                          className="mt-1"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="routing_last4">Routing Last 4</Label>
                        <Input
                          id="routing_last4"
                          value={newPayment.routing_last4}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, routing_last4: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
                          className="mt-1"
                          maxLength={4}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-blue-100">
                  <Button
                    onClick={handleAddPaymentMethod}
                    disabled={addingPayment}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Payment Method
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewPayment({
                      method_type: "card",
                      nickname: "",
                      brand: "",
                      last4: "",
                      exp_month: "",
                      exp_year: "",
                      bank_name: "",
                      account_type: "checking",
                      routing_last4: "",
                      is_default: paymentMethods.length === 0,
                    })}
                    disabled={addingPayment}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.length === 0 ? (
                  <div className="text-sm text-slate-500 bg-white/60 border border-dashed border-blue-200 rounded-xl p-6 text-center">
                    No payment methods on file yet.
                  </div>
                ) : (
                  paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className={`rounded-xl p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm border transition hover:shadow-md ${method.is_default ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center ${method.method_type === "card" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {method.method_type === "card" ? <CreditCard className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}
                        </div>
                        <div>
                          <Badge className={method.method_type === "card" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}>
                            {method.method_type === "card" ? "Card" : "ACH"}
                          </Badge>
                          <p className="font-medium text-slate-900 mt-2">
                            {method.nickname || (method.method_type === "card" ? `${method.brand || "Card"} •••• ${method.last4}` : `${method.bank_name || "Bank"} •••• ${method.last4}`)}
                          </p>
                          <div className="text-xs text-slate-500 space-x-2">
                            {method.method_type === "card" ? (
                              <>
                                <span>{method.brand}</span>
                                {method.exp_month && method.exp_year && <span>Exp {String(method.exp_month).padStart(2, "0")}/{method.exp_year}</span>}
                              </>
                            ) : (
                              <>
                                <span>{method.bank_name}</span>
                                {method.account_type && <span className="capitalize">{method.account_type}</span>}
                              </>
                            )}
                          </div>
                          {method.is_default && (
                            <div className="mt-2">
                              <Badge className="bg-blue-100 text-blue-700">Default</Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={method.is_default}
                          onCheckedChange={(checked) => handleSetDefaultPayment(method.id, checked)}
                        />
                        <span className="text-xs text-slate-500">Default</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-palette-primary" />
                    Subscriptions & Access
                  </CardTitle>
                  <CardDescription>Manage auditor, analyst and other access plans</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscriptionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{subscriptionError}</span>
                </div>
              )}

              <div className="border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50/60">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plan_name">Plan</Label>
                    <Select
                      value={newSubscription.plan_name}
                      onValueChange={(value) => setNewSubscription(prev => ({ ...prev, plan_name: value, role: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auditor">Auditor</SelectItem>
                        <SelectItem value="Analyst">Analyst</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newSubscription.start_date}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, start_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newSubscription.end_date}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, end_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newSubscription.notes}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1"
                      placeholder="Optional description or reference"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_recurring"
                      checked={newSubscription.is_recurring}
                      onCheckedChange={(checked) => setNewSubscription(prev => ({ ...prev, is_recurring: checked }))}
                    />
                    <div>
                      <Label htmlFor="is_recurring" className="cursor-pointer">Recurring billing</Label>
                      <p className="text-xs text-slate-500">Auto-renew until cancelled</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={handleAddSubscription}
                    disabled={addingSubscription}
                    className="bg-palette-primary hover:bg-palette-primary-hover"
                  >
                    {addingSubscription ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Repeat className="h-4 w-4 mr-2" />
                        Add Subscription
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={addingSubscription}
                    onClick={() => setNewSubscription({
                      plan_name: "Auditor",
                      role: "Auditor",
                      start_date: new Date().toISOString().slice(0, 10),
                      end_date: "",
                      is_recurring: true,
                      notes: "",
                    })}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {subscriptions.length === 0 ? (
                  <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                    No subscriptions yet.
                  </div>
                ) : (
                  subscriptions.map(sub => (
                    <div key={sub.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {sub.plan_name}
                            <span className="ml-2 text-sm text-slate-500">Role: {sub.role}</span>
                          </p>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-3 mt-2">
                            <span className="flex items-center gap-1">
                              <CalendarRange className="h-3 w-3" />
                              {sub.start_date} {sub.end_date ? `→ ${sub.end_date}` : ""}
                            </span>
                            <span className="capitalize">Status: {sub.status}</span>
                            <span>
                              Recurring: {sub.is_recurring ? "Yes" : "No"}
                            </span>
                          </div>
                          {sub.notes && <p className="text-xs text-slate-500 mt-2">Notes: {sub.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={sub.is_recurring}
                            onCheckedChange={(checked) => handleToggleSubscriptionRecurring(sub.id, checked)}
                          />
                          <span className="text-xs text-slate-500">Auto-renew</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancelSubscription(sub.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-palette-primary" />
                    Billing History
                  </CardTitle>
                  <CardDescription>Track invoices and payment outcomes</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {billingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{billingError}</span>
                </div>
              )}

              <div className="border border-dashed border-slate-200 rounded-lg p-4 bg-slate-50/60">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                      className="mt-1"
                      placeholder="e.g. 199.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={newTransaction.currency}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                      className="mt-1"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice_id">Invoice ID</Label>
                    <Input
                      id="invoice_id"
                      value={newTransaction.invoice_id}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, invoice_id: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={handleAddTransaction}
                    disabled={addingTransaction}
                    className="bg-palette-primary hover:bg-palette-primary-hover"
                  >
                    {addingTransaction ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      <>
                        <Banknote className="h-4 w-4 mr-2" />
                        Add Entry
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    disabled={addingTransaction}
                    onClick={() => setNewTransaction({ amount: "", currency: "USD", description: "", invoice_id: "" })}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {billingHistory.length === 0 ? (
                  <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                    No billing history recorded yet.
                  </div>
                ) : (
                  billingHistory.map(entry => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(entry.amount, entry.currency)}
                          </p>
                          <p className="text-xs text-slate-500">{entry.description || "Manual entry"}</p>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-3 mt-2">
                            {entry.invoice_id && <span>Invoice: {entry.invoice_id}</span>}
                            <span>Status: {entry.status}</span>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDateTime(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
