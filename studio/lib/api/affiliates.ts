/**
 * Affiliates API Client
 * TypeScript API client for affiliate management operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types
export interface Affiliate {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
  };
  affiliate_code: string;
  company_name?: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_commission_amount?: number;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  notes?: string;
  total_referrals: number;
  total_conversions: number;
  total_commission_earned: number;
  total_commission_paid: number;
  total_commission_pending: number;
  payout_threshold: number;
  payout_method: 'paypal' | 'stripe' | 'bank_transfer' | 'check';
  payout_email?: string;
  bank_account_details?: Record<string, any>;
  tax_entity_type: 'individual' | 'business';
  tax_id_type?: 'ssn' | 'ein';
  tax_id_number?: string;
  legal_name?: string;
  tax_address_line1?: string;
  tax_address_line2?: string;
  tax_city?: string;
  tax_state?: string;
  tax_postal_code?: string;
  tax_country: string;
  w9_completed: boolean;
  w9_completed_at?: string;
  current_year_earnings: number;
  last_1099_year?: number;
  last_1099_amount?: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: number;
  rejected_at?: string;
  rejected_by?: number;
  rejection_reason?: string;
  application_notes?: string;
  referral_url?: string;
  can_request_payout?: boolean;
}

export interface Referral {
  id: number;
  affiliate: Affiliate;
  referral_code: string;
  referred_user?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  ip_address?: string;
  user_agent?: string;
  referrer_url?: string;
  landing_page?: string;
  status: 'pending' | 'signed_up' | 'converted' | 'expired' | 'invalid';
  signed_up_at?: string;
  converted_at?: string;
  conversion_subscription?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  cookie_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: number;
  affiliate: Affiliate;
  referral: Referral;
  subscription: number;
  subscription_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payout?: number;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
}

export interface AffiliatePayout {
  id: number;
  affiliate: Affiliate;
  total_amount: number;
  currency: string;
  payout_method: string;
  payout_reference?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  paid_at?: string;
  period_start: string;
  period_end: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  processed_by?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
  commission_count?: number;
}

export interface AffiliateStats {
  total_affiliates: number;
  active_affiliates: number;
  pending_affiliates: number;
  total_referrals: number;
  total_conversions: number;
  conversion_rate: number;
  total_commissions_earned: number;
  total_commissions_paid: number;
  total_commissions_pending: number;
  pending_payouts_count: number;
  pending_payouts_amount: number;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Helper function to make authenticated request
async function makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      console.error('API Error Response:', errorData);
      // Handle different error response formats
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (Object.keys(errorData).length > 0) {
        // If errorData has keys but no standard error field, stringify it
        errorMessage = JSON.stringify(errorData);
      }
    } catch (e) {
      // Response is not JSON, try to get text
      try {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      } catch (textError) {
        // If we can't read the response, use the status
        console.error('Could not parse error response:', textError);
      }
    }
    throw new Error(errorMessage);
  }

  return response;
}

// Affiliate operations
export async function fetchAffiliates(params?: {
  status?: string;
  search?: string;
}): Promise<Affiliate[]> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE}/api/affiliates/affiliates/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeRequest(url);
  return response.json();
}

export async function fetchAffiliate(id: number): Promise<Affiliate> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/${id}/`);
  return response.json();
}

export async function createAffiliate(data: Partial<Affiliate>): Promise<Affiliate> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function updateAffiliate(id: number, data: Partial<Affiliate>): Promise<Affiliate> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function deleteAffiliate(id: number): Promise<void> {
  await makeRequest(`${API_BASE}/api/affiliates/affiliates/${id}/`, {
    method: 'DELETE',
  });
}

export async function approveAffiliate(id: number): Promise<Affiliate> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/${id}/approve/`, {
    method: 'POST',
  });
  return response.json();
}

export async function suspendAffiliate(id: number): Promise<Affiliate> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/${id}/suspend/`, {
    method: 'POST',
  });
  return response.json();
}

export async function rejectAffiliate(id: number, reason?: string): Promise<Affiliate> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || 'Application rejected by administrator' }),
  });
  return response.json();
}

export async function generateAffiliateCode(): Promise<{ affiliate_code: string }> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/affiliates/generate-code/`);
  return response.json();
}

// Referral operations
export async function fetchReferrals(params?: {
  status?: string;
  affiliate_id?: number;
}): Promise<Referral[]> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE}/api/affiliates/referrals/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeRequest(url);
  return response.json();
}

// Commission operations
export async function fetchCommissions(params?: {
  status?: string;
  affiliate_id?: number;
}): Promise<Commission[]> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE}/api/affiliates/commissions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeRequest(url);
  return response.json();
}

export async function approveCommission(id: number): Promise<Commission> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/commissions/${id}/approve/`, {
    method: 'POST',
  });
  return response.json();
}

// Payout operations
export async function fetchPayouts(params?: {
  status?: string;
}): Promise<AffiliatePayout[]> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const url = `${API_BASE}/api/affiliates/payouts/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeRequest(url);
  return response.json();
}

export async function createPayoutRequest(): Promise<AffiliatePayout> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/payouts/`, {
    method: 'POST',
  });
  return response.json();
}

export async function processPayout(id: number): Promise<AffiliatePayout> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/payouts/${id}/process/`, {
    method: 'POST',
  });
  return response.json();
}

// Statistics
export async function fetchAffiliateStats(): Promise<AffiliateStats> {
  const response = await makeRequest(`${API_BASE}/api/affiliates/stats/`);
  try {
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error parsing stats response:', error);
    throw new Error('Failed to parse statistics response');
  }
}

