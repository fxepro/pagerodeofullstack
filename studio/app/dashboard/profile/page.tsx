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
  Phone,
  FileText,
  Image,
  Globe,
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
  phone?: string;
  bio?: string;
  avatar_url?: string;
  timezone?: string;
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
  // Card fields
  cardholder_name?: string;
  card_number?: string; // Full 16 digits
  brand?: string;
  last4?: string; // Last 4 digits for display
  exp_month?: number | null;
  exp_year?: number | null;
  // Billing address for card
  billing_address_line1?: string;
  billing_address_line2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  // ACH fields
  bank_name?: string;
  account_type?: string;
  account_number?: string; // Full account number
  routing_number?: string; // Full routing number
  // Bank address for ACH
  bank_address_line1?: string;
  bank_address_line2?: string;
  bank_city?: string;
  bank_state?: string;
  bank_postal_code?: string;
  bank_country?: string;
  is_default: boolean;
  created_at: string;
}

interface Subscription {
  id: number;
  plan_name: string;
  role: string;
  price_monthly?: number | string;
  price_yearly?: number | string;
  billing_period?: 'monthly' | 'annual';
  discount_code?: string;
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

  const [editPersonalInfo, setEditPersonalInfo] = useState(false);
  const [editCorporateInfo, setEditCorporateInfo] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);

  // Personal info fields
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("UTC");

  // Password fields
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Payment form state
  const [newPayment, setNewPayment] = useState({
    method_type: "card" as "card" | "ach",
    nickname: "",
    // Card fields
    cardholder_name: "",
    card_number: "",
    brand: "",
    exp_month: "",
    exp_year: "",
    billing_address_line1: "",
    billing_address_line2: "",
    billing_city: "",
    billing_state: "",
    billing_postal_code: "",
    billing_country: "",
    // ACH fields
    bank_name: "",
    account_type: "checking",
    account_number: "",
    routing_number: "",
    bank_address_line1: "",
    bank_address_line2: "",
    bank_city: "",
    bank_state: "",
    bank_postal_code: "",
    bank_country: "",
    is_default: false,
  });

  // Plan pricing structure
  const planPricing: Record<string, { monthly: number; yearly: number }> = {
    "Trial": { monthly: 0, yearly: 0 },
    "Viewer": { monthly: 9.99, yearly: 99.99 },
    "Auditor": { monthly: 29.99, yearly: 299.99 },
    "Analyst": { monthly: 109.99, yearly: 1099.99 },
    "Manager": { monthly: 249.99, yearly: 2499.99 },
    "Director": { monthly: 499.99, yearly: 4999.99 },
  };

  // Subscription form state
  const [newSubscription, setNewSubscription] = useState({
    plan_name: "Trial",
    role: "viewer",
    price_monthly: "0",
    price_yearly: "0",
    billing_period: "monthly" as "monthly" | "annual",
    discount_code: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    is_recurring: true,
    notes: "",
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
      setPhone(data.phone || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
      setAvatarPreview(null);
      setAvatarFile(null);
      setTimezone(data.timezone || "UTC");
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
      // Sort by created_at descending (newest first) - backend should already do this, but ensure it
      const sortedData = [...data].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBillingHistory(sortedData);
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

      // If avatar file is selected, convert to base64 data URL
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
        finalAvatarUrl = dataUrl;
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
          phone,
          bio,
          avatar_url: finalAvatarUrl,
          timezone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update profile (${response.status})`);
      }

      const updatedData = await response.json();
      setUser(updatedData);
      // Update local state from response
      setEmail(updatedData.email || "");
      setFirstName(updatedData.first_name || "");
      setLastName(updatedData.last_name || "");
      setPhone(updatedData.phone || "");
      setBio(updatedData.bio || "");
      setAvatarUrl(updatedData.avatar_url || "");
      setAvatarPreview(null);
      setAvatarFile(null);
      setTimezone(updatedData.timezone || "UTC");
      setEditPersonalInfo(false);
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
      setCorporateError(null);
      setEditCorporateInfo(false);
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
      if (!newPayment.cardholder_name || !newPayment.card_number || !newPayment.exp_month || !newPayment.exp_year) {
        setPaymentsError("Please complete all card details (cardholder name, card number, expiration)");
        return;
      }
      // Validate card number (16 digits)
      const cardNumber = newPayment.card_number.replace(/\s/g, "");
      if (cardNumber.length !== 16 || !/^\d+$/.test(cardNumber)) {
        setPaymentsError("Card number must be 16 digits");
        return;
      }
      // Validate expiration
      const expMonth = parseInt(newPayment.exp_month);
      const expYear = parseInt(newPayment.exp_year);
      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        setPaymentsError("Expiration month must be between 1 and 12");
        return;
      }
      if (isNaN(expYear) || expYear < new Date().getFullYear()) {
        setPaymentsError("Expiration year must be current or future year");
        return;
      }
    } else {
      if (!newPayment.bank_name || !newPayment.account_number || !newPayment.routing_number) {
        setPaymentsError("Please provide bank name, account number, and routing number");
        return;
      }
      // Validate routing number (9 digits)
      const routingNumber = newPayment.routing_number.replace(/\s/g, "");
      if (routingNumber.length !== 9 || !/^\d+$/.test(routingNumber)) {
        setPaymentsError("Routing number must be 9 digits");
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
        cardholder_name: "",
        card_number: "",
        brand: "",
        exp_month: "",
        exp_year: "",
        billing_address_line1: "",
        billing_address_line2: "",
        billing_city: "",
        billing_state: "",
        billing_postal_code: "",
        billing_country: "",
        bank_name: "",
        account_type: "checking",
        account_number: "",
        routing_number: "",
        bank_address_line1: "",
        bank_address_line2: "",
        bank_city: "",
        bank_state: "",
        bank_postal_code: "",
        bank_country: "",
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

    if (!newSubscription.plan_name) {
      setSubscriptionError("Plan name is required");
      return;
    }

    // Validate pricing if provided
    if (newSubscription.price_monthly && (isNaN(parseFloat(newSubscription.price_monthly as string)) || parseFloat(newSubscription.price_monthly as string) < 0)) {
      setSubscriptionError("Price/month must be a valid positive number");
      return;
    }
    if (newSubscription.price_yearly && (isNaN(parseFloat(newSubscription.price_yearly as string)) || parseFloat(newSubscription.price_yearly as string) < 0)) {
      setSubscriptionError("Price/year must be a valid positive number");
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
        plan_name: "Trial",
        role: "viewer",
        price_monthly: "0",
        price_yearly: "0",
        billing_period: "monthly",
        discount_code: "",
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
                {!editPersonalInfo && (
                  <Button
                    onClick={() => setEditPersonalInfo(true)}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileError && !editPersonalInfo && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{profileError}</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Username and Role - Read-only */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user.username} disabled className="bg-slate-100 border-slate-400 mt-1" />
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
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  {editPersonalInfo ? (
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{user.email || "Not set"}</p>
                  )}
                </div>

                {/* First Name and Last Name - Same Line */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    {editPersonalInfo ? (
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                      />
                    ) : (
                      <p className="mt-2 text-slate-800">{user.first_name || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    {editPersonalInfo ? (
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                      />
                    ) : (
                      <p className="mt-2 text-slate-800">{user.last_name || "Not set"}</p>
                    )}
                  </div>
                </div>

                {/* Phone and Timezone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </Label>
                    {editPersonalInfo ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <p className="mt-2 text-slate-800">{user.phone || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="timezone" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Timezone
                    </Label>
                    {editPersonalInfo ? (
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 25 }, (_, i) => {
                            const offset = i - 12; // UTC-12 to UTC+12
                            const sign = offset >= 0 ? '+' : '';
                            const label = offset === 0 ? 'UTC (UTC+0)' : `UTC${sign}${offset}`;
                            const value = offset === 0 ? 'UTC' : `UTC${sign}${offset}`;
                            return (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-2 text-slate-800">{user.timezone || "UTC"}</p>
                    )}
                  </div>
                </div>

                {/* Avatar - Photo Upload */}
                <div>
                  <Label htmlFor="avatar" className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    Avatar Photo
                  </Label>
                  {editPersonalInfo ? (
                    <div className="mt-1 space-y-3">
                      <div className="flex items-center gap-4">
                        {(avatarPreview || user.avatar_url) && (
                          <div className="relative">
                            <img
                              src={avatarPreview || user.avatar_url || ''}
                              alt="Avatar preview"
                              className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file size (max 5MB)
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("Image size must be less than 5MB");
                                  return;
                                }
                                // Validate file type
                                if (!file.type.startsWith('image/')) {
                                  toast.error("Please select an image file");
                                  return;
                                }
                                setAvatarFile(file);
                                // Create preview
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setAvatarPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="cursor-pointer bg-slate-100 border-slate-400 focus:border-slate-600"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Upload a profile picture (JPG, PNG, max 5MB)
                          </p>
                        </div>
                      </div>
                      {avatarFile && (
                        <p className="text-sm text-slate-600">
                          Selected: {avatarFile.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-3">
                      {user.avatar_url ? (
                        <>
                          <img
                            src={user.avatar_url}
                            alt="Avatar"
                            className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <p className="text-slate-800 text-sm break-all">{user.avatar_url}</p>
                        </>
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                          <User className="h-8 w-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio - Text Box */}
                <div>
                  <Label htmlFor="bio" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Bio
                  </Label>
                  {editPersonalInfo ? (
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                      placeholder="Tell us about yourself..."
                      rows={5}
                    />
                  ) : (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-slate-800 whitespace-pre-wrap">{user.bio || "Not set"}</p>
                    </div>
                  )}
                </div>
              </div>

              {editPersonalInfo && (
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
                      setEditPersonalInfo(false);
                      setEmail(user.email || "");
                      setFirstName(user.first_name || "");
                      setLastName(user.last_name || "");
                      setPhone(user.phone || "");
                      setBio(user.bio || "");
                      setAvatarUrl(user.avatar_url || "");
                      setAvatarPreview(null);
                      setAvatarFile(null);
                      setTimezone(user.timezone || "UTC");
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-palette-primary" />
                    Corporate Information
                  </CardTitle>
                  <CardDescription>Keep your organisation details current</CardDescription>
                </div>
                {!editCorporateInfo && (
                  <Button
                    onClick={() => setEditCorporateInfo(true)}
                    variant="outline"
                    className="border-palette-accent-2 text-palette-primary hover:bg-palette-accent-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {corporateError && !editCorporateInfo && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{corporateError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="company_name"
                      value={corporateInfo.company_name}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, company_name: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                      placeholder="Company or organisation"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.company_name || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="job_title">Title / Department</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="job_title"
                      value={corporateInfo.job_title}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, job_title: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.job_title || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="phone"
                      value={corporateInfo.phone}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.phone || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="website"
                      value={corporateInfo.website}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, website: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                      placeholder="https://"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.website || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="tax_id">Tax ID / VAT</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="tax_id"
                      value={corporateInfo.tax_id}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, tax_id: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.tax_id || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="country"
                      value={corporateInfo.country}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, country: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.country || "Not set"}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="address_line1"
                      value={corporateInfo.address_line1}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, address_line1: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.address_line1 || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="address_line2"
                      value={corporateInfo.address_line2}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, address_line2: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.address_line2 || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="city"
                      value={corporateInfo.city}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.city || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">State / Province</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="state"
                      value={corporateInfo.state}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, state: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.state || "Not set"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  {editCorporateInfo ? (
                    <Input
                      id="postal_code"
                      value={corporateInfo.postal_code}
                      onChange={(e) => setCorporateInfo(prev => ({ ...prev, postal_code: e.target.value }))}
                      className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    />
                  ) : (
                    <p className="mt-2 text-slate-800">{corporateInfo.postal_code || "Not set"}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                {editCorporateInfo ? (
                  <Textarea
                    id="notes"
                    value={corporateInfo.notes}
                    onChange={(e) => setCorporateInfo(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 bg-slate-100 border-slate-400 focus:border-slate-600"
                    placeholder="Internal notes or billing instructions"
                    rows={3}
                  />
                ) : (
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-800 whitespace-pre-wrap">{corporateInfo.notes || "Not set"}</p>
                  </div>
                )}
              </div>

              {editCorporateInfo && (
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
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setEditCorporateInfo(false);
                    // Reset to original values
                    const headers = authHeaders();
                    if (headers) {
                      fetchCorporateInfo(headers);
                    }
                    setCorporateError(null);
                  }}
                  variant="outline"
                  disabled={savingCorporate}
                >
                  Cancel
                </Button>
                </div>
              )}
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
                          ...prev,
                          method_type: value,
                          // Reset card fields
                          cardholder_name: "",
                          card_number: "",
                          brand: "",
                          exp_month: "",
                          exp_year: "",
                          billing_address_line1: "",
                          billing_address_line2: "",
                          billing_city: "",
                          billing_state: "",
                          billing_postal_code: "",
                          billing_country: "",
                          // Reset ACH fields
                          bank_name: "",
                          account_type: "checking",
                          account_number: "",
                          routing_number: "",
                          bank_address_line1: "",
                          bank_address_line2: "",
                          bank_city: "",
                          bank_state: "",
                          bank_postal_code: "",
                          bank_country: "",
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
                      <div className="md:col-span-2">
                        <Label htmlFor="cardholder_name">Cardholder Name *</Label>
                        <Input
                          id="cardholder_name"
                          value={newPayment.cardholder_name}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, cardholder_name: e.target.value }))}
                          className="mt-1"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="card_number">Card Number (16 digits) *</Label>
                        <Input
                          id="card_number"
                          value={newPayment.card_number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "").slice(0, 16);
                            setNewPayment(prev => ({ ...prev, card_number: value }));
                          }}
                          className="mt-1"
                          placeholder="1234567890123456"
                          maxLength={19}
                        />
                      </div>
                      <div>
                        <Label htmlFor="brand">Card Brand</Label>
                        <Input
                          id="brand"
                          value={newPayment.brand}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, brand: e.target.value }))}
                          className="mt-1"
                          placeholder="Visa, Mastercard, Amex"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exp_month">Expiry Month *</Label>
                        <Input
                          id="exp_month"
                          value={newPayment.exp_month}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, exp_month: e.target.value.replace(/[^0-9]/g, "").slice(0, 2) }))}
                          className="mt-1"
                          placeholder="MM"
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="exp_year">Expiry Year *</Label>
                        <Input
                          id="exp_year"
                          value={newPayment.exp_year}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, exp_year: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) }))}
                          className="mt-1"
                          placeholder="YYYY"
                          maxLength={4}
                        />
                      </div>
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-sm font-semibold mb-3">Billing Address (Optional)</h4>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="billing_address_line1">Address Line 1</Label>
                        <Input
                          id="billing_address_line1"
                          value={newPayment.billing_address_line1}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, billing_address_line1: e.target.value }))}
                          className="mt-1"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="billing_address_line2">Address Line 2</Label>
                        <Input
                          id="billing_address_line2"
                          value={newPayment.billing_address_line2}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, billing_address_line2: e.target.value }))}
                          className="mt-1"
                          placeholder="Apt 4B"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing_city">City</Label>
                        <Input
                          id="billing_city"
                          value={newPayment.billing_city}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, billing_city: e.target.value }))}
                          className="mt-1"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing_state">State</Label>
                        <Input
                          id="billing_state"
                          value={newPayment.billing_state}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, billing_state: e.target.value }))}
                          className="mt-1"
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing_postal_code">Postal Code</Label>
                        <Input
                          id="billing_postal_code"
                          value={newPayment.billing_postal_code}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, billing_postal_code: e.target.value }))}
                          className="mt-1"
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="billing_country">Country</Label>
                        <Input
                          id="billing_country"
                          value={newPayment.billing_country}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, billing_country: e.target.value }))}
                          className="mt-1"
                          placeholder="USA"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:col-span-2">
                        <Label htmlFor="bank_name">Bank Name *</Label>
                        <Input
                          id="bank_name"
                          value={newPayment.bank_name}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_name: e.target.value }))}
                          className="mt-1"
                          placeholder="Chase Bank"
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
                        <Label htmlFor="account_number">Account Number *</Label>
                        <Input
                          id="account_number"
                          value={newPayment.account_number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "");
                            setNewPayment(prev => ({ ...prev, account_number: value }));
                          }}
                          className="mt-1"
                          placeholder="Full account number"
                          type="password"
                        />
                      </div>
                      <div>
                        <Label htmlFor="routing_number">Routing Number (9 digits) *</Label>
                        <Input
                          id="routing_number"
                          value={newPayment.routing_number}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, "").replace(/[^0-9]/g, "").slice(0, 9);
                            setNewPayment(prev => ({ ...prev, routing_number: value }));
                          }}
                          className="mt-1"
                          placeholder="123456789"
                          maxLength={9}
                        />
                      </div>
                      <div className="md:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-sm font-semibold mb-3">Bank Address (Optional)</h4>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="bank_address_line1">Address Line 1</Label>
                        <Input
                          id="bank_address_line1"
                          value={newPayment.bank_address_line1}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_address_line1: e.target.value }))}
                          className="mt-1"
                          placeholder="123 Bank St"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="bank_address_line2">Address Line 2</Label>
                        <Input
                          id="bank_address_line2"
                          value={newPayment.bank_address_line2}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_address_line2: e.target.value }))}
                          className="mt-1"
                          placeholder="Suite 100"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_city">City</Label>
                        <Input
                          id="bank_city"
                          value={newPayment.bank_city}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_city: e.target.value }))}
                          className="mt-1"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_state">State</Label>
                        <Input
                          id="bank_state"
                          value={newPayment.bank_state}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_state: e.target.value }))}
                          className="mt-1"
                          placeholder="NY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_postal_code">Postal Code</Label>
                        <Input
                          id="bank_postal_code"
                          value={newPayment.bank_postal_code}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_postal_code: e.target.value }))}
                          className="mt-1"
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bank_country">Country</Label>
                        <Input
                          id="bank_country"
                          value={newPayment.bank_country}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, bank_country: e.target.value }))}
                          className="mt-1"
                          placeholder="USA"
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
                      cardholder_name: "",
                      card_number: "",
                      brand: "",
                      exp_month: "",
                      exp_year: "",
                      billing_address_line1: "",
                      billing_address_line2: "",
                      billing_city: "",
                      billing_state: "",
                      billing_postal_code: "",
                      billing_country: "",
                      bank_name: "",
                      account_type: "checking",
                      account_number: "",
                      routing_number: "",
                      bank_address_line1: "",
                      bank_address_line2: "",
                      bank_city: "",
                      bank_state: "",
                      bank_postal_code: "",
                      bank_country: "",
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
                    <Label htmlFor="plan_name">Plan *</Label>
                    <Select
                      value={newSubscription.plan_name}
                      onValueChange={(value) => {
                        const roleMap: Record<string, string> = {
                          'Trial': 'viewer',
                          'Viewer': 'viewer',
                          'Auditor': 'analyst',
                          'Analyst': 'analyst',
                          'Manager': 'manager',
                          'Director': 'director',
                        };
                        const pricing = planPricing[value] || { monthly: 0, yearly: 0 };
                        setNewSubscription(prev => ({ 
                          ...prev, 
                          plan_name: value, 
                          role: roleMap[value] || 'viewer',
                          price_monthly: pricing.monthly.toString(),
                          price_yearly: pricing.yearly.toString(),
                        }));
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Trial">Trial</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                        <SelectItem value="Auditor">Auditor</SelectItem>
                        <SelectItem value="Analyst">Analyst</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Director">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="billing_period">Billing Period</Label>
                    <Select
                      value={newSubscription.billing_period}
                      onValueChange={(value: "monthly" | "annual") => 
                        setNewSubscription(prev => ({ ...prev, billing_period: value }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price_monthly">Price/Month ($)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newSubscription.price_monthly}
                      readOnly
                      disabled
                      className="mt-1 bg-slate-100 cursor-not-allowed"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-slate-500 mt-1">Set by plan selection</p>
                  </div>

                  <div>
                    <Label htmlFor="price_yearly">Price/Year ($)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newSubscription.price_yearly}
                      readOnly
                      disabled
                      className="mt-1 bg-slate-100 cursor-not-allowed"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-slate-500 mt-1">Set by plan selection</p>
                  </div>

                  <div>
                    <Label htmlFor="discount_code">Discount Code</Label>
                    <Input
                      id="discount_code"
                      type="text"
                      value={newSubscription.discount_code}
                      onChange={(e) => setNewSubscription(prev => ({ ...prev, discount_code: e.target.value.toUpperCase() }))}
                      className="mt-1"
                      placeholder="Enter discount code"
                      maxLength={20}
                    />
                    <p className="text-xs text-slate-500 mt-1">Optional promotional code</p>
                  </div>

                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={newSubscription.start_date}
                      readOnly
                      disabled
                      className="mt-1 bg-slate-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Auto-set to today</p>
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={newSubscription.end_date || ""}
                      readOnly
                      disabled
                      className="mt-1 bg-slate-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">Calculated automatically</p>
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
                      plan_name: "Trial",
                      role: "viewer",
                      price_monthly: "0",
                      price_yearly: "0",
                      billing_period: "monthly",
                      discount_code: "",
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
                            {sub.billing_period && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded capitalize">
                                {sub.billing_period}
                              </span>
                            )}
                          </p>
                          <div className="text-xs text-slate-500 flex flex-wrap gap-3 mt-2">
                            {(sub.price_monthly || sub.price_yearly) && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {sub.price_monthly && `$${sub.price_monthly}/mo`}
                                {sub.price_monthly && sub.price_yearly && " • "}
                                {sub.price_yearly && `$${sub.price_yearly}/yr`}
                              </span>
                            )}
                            {sub.discount_code && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                Code: {sub.discount_code}
                              </span>
                            )}
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
                  <CardDescription>View all invoices and payment transactions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {billingError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 text-sm">{billingError}</span>
                </div>
              )}

              {billingHistory.length === 0 ? (
                <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  No billing history recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Invoice ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map(entry => (
                        <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {formatDateTime(entry.created_at)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">
                            {formatCurrency(entry.amount, entry.currency)}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {entry.description || "—"}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 font-mono">
                            {entry.invoice_id || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge 
                              className={
                                entry.status === 'paid' ? 'bg-green-100 text-green-800' :
                                entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                entry.status === 'failed' ? 'bg-red-100 text-red-800' :
                                entry.status === 'refunded' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'
                              }
                            >
                              {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
