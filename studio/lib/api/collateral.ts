/**
 * Collateral API Client
 * TypeScript API client for learning materials (collateral) operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types
export interface LearningMaterial {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  featured_image_url?: string;
  video_url?: string;
  og_image?: string;
  og_image_url?: string;
  author: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
    description: string;
    icon?: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
    description?: string;
  }>;
  content_type: 'documentation' | 'tutorial' | 'video' | 'guide' | 'quick-start' | 'reference' | 'faq';
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
  views_count: number;
  read_time: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  language: string;
  translations?: Record<string, any>;
  related_feature?: string;
  related_feature_url?: string;
}

export interface CollateralCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  created_at: string;
  order: number;
  post_count: number;
}

export interface CollateralTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  post_count: number;
}

export interface LearningMaterialListResponse {
  results: LearningMaterial[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LearningMaterialCreateData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featured_image?: File | string;
  video_url?: string;
  category_id?: number | null;
  tag_ids?: number[];
  content_type?: 'documentation' | 'tutorial' | 'video' | 'guide' | 'quick-start' | 'reference' | 'faq';
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: File | string;
  language?: string;
  translations?: Record<string, any>;
  related_feature?: string;
  related_feature_url?: string;
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
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response;
}

// Material operations
export async function fetchLearningMaterials(params?: {
  status?: string;
  category?: string;
  tag?: string;
  content_type?: string;
  related_feature?: string;
  search?: string;
  language?: string;
  featured?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<LearningMaterialListResponse> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const url = `${API_BASE}/api/collateral/materials/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeRequest(url);
  return response.json();
}

export async function fetchLearningMaterial(id: number): Promise<LearningMaterial> {
  const response = await makeRequest(`${API_BASE}/api/collateral/materials/${id}/`);
  return response.json();
}

export async function fetchLearningMaterialBySlug(slug: string): Promise<LearningMaterial> {
  const response = await makeRequest(`${API_BASE}/api/collateral/materials/slug/${slug}/`);
  return response.json();
}

export async function createLearningMaterial(data: LearningMaterialCreateData): Promise<LearningMaterial> {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === 'featured_image' || key === 'og_image') {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === 'string') {
          formData.append(key, value);
        }
      } else if (key === 'tag_ids' && Array.isArray(value)) {
        value.forEach((tagId, index) => {
          formData.append(`tag_ids[${index}]`, String(tagId));
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/api/collateral/materials/create/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error('API Error:', errorData);
    // Format validation errors nicely
    if (errorData && typeof errorData === 'object') {
      const errorMessages = Object.entries(errorData).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`;
        }
        return `${key}: ${value}`;
      }).join('\n');
      throw new Error(errorMessages || errorData.error || `HTTP ${response.status}`);
    }
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function updateLearningMaterial(id: number, data: Partial<LearningMaterialCreateData>): Promise<LearningMaterial> {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined values, but include null for category_id
    if (value === undefined) return;
    
    if (key === 'featured_image' || key === 'og_image') {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'string' && value) {
        formData.append(key, value);
      }
    } else if (key === 'tag_ids' && Array.isArray(value)) {
      // Send tag_ids as array items
      if (value.length > 0) {
        value.forEach((tagId, index) => {
          formData.append(`tag_ids[${index}]`, String(tagId));
        });
      }
    } else if (key === 'category_id') {
      // Send category_id only if it's not null
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    } else if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== '') {
      formData.append(key, String(value));
    }
  });
  
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/api/collateral/materials/${id}/update/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    console.error('API Error:', errorData);
    // Format validation errors nicely
    if (errorData && typeof errorData === 'object') {
      const errorMessages = Object.entries(errorData).map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(', ')}`;
        }
        return `${key}: ${value}`;
      }).join('\n');
      throw new Error(errorMessages || errorData.error || `HTTP ${response.status}`);
    }
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function deleteLearningMaterial(id: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/api/collateral/materials/${id}/delete/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
}

export async function incrementViewCount(id: number): Promise<{ views_count: number }> {
  const response = await makeRequest(`${API_BASE}/api/collateral/materials/${id}/view/`, {
    method: 'POST',
  });
  return response.json();
}

// Category operations
export async function fetchCollateralCategories(): Promise<CollateralCategory[]> {
  const response = await makeRequest(`${API_BASE}/api/collateral/categories/`);
  return response.json();
}

// Tag operations
export async function fetchCollateralTags(): Promise<CollateralTag[]> {
  const response = await makeRequest(`${API_BASE}/api/collateral/tags/`);
  return response.json();
}

