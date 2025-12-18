/**
 * Blog API Client
 * TypeScript API client for blog operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Types
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  featured_image_url?: string;
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
  }>;
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
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  created_at: string;
  order: number;
  post_count: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  post_count: number;
}

export interface BlogPostListResponse {
  results: BlogPost[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BlogPostCreateData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featured_image?: File | string;
  category_id?: number | null;
  tag_ids?: number[];
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_image?: File | string;
  language?: string;
  translations?: Record<string, any>;
}

// Helper function to get auth token
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

// Helper function to make authenticated request
async function makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
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

// Post operations
export async function fetchBlogPosts(params?: {
  status?: string;
  category?: string;
  tag?: string;
  search?: string;
  language?: string;
  featured?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}): Promise<BlogPostListResponse> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  const url = `${API_BASE}/api/blog/posts/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const response = await makeRequest(url);
  return response.json();
}

export async function fetchBlogPost(id: number): Promise<BlogPost> {
  const response = await makeRequest(`${API_BASE}/api/blog/posts/${id}/`);
  return response.json();
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost> {
  const response = await makeRequest(`${API_BASE}/api/blog/posts/slug/${slug}/`);
  return response.json();
}

export async function createBlogPost(data: BlogPostCreateData): Promise<BlogPost> {
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
  const response = await fetch(`${API_BASE}/api/blog/posts/create/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function updateBlogPost(id: number, data: Partial<BlogPostCreateData>): Promise<BlogPost> {
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
  const response = await fetch(`${API_BASE}/api/blog/posts/${id}/update/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export async function deleteBlogPost(id: number): Promise<void> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/api/blog/posts/${id}/delete/`, {
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

export async function fetchFeaturedPosts(): Promise<BlogPost[]> {
  const response = await makeRequest(`${API_BASE}/api/blog/posts/featured/`);
  return response.json();
}

export async function fetchRecentPosts(limit: number = 10): Promise<BlogPost[]> {
  const response = await makeRequest(`${API_BASE}/api/blog/posts/recent/?limit=${limit}`);
  return response.json();
}

export async function incrementViewCount(id: number): Promise<{ views_count: number }> {
  const response = await makeRequest(`${API_BASE}/api/blog/posts/${id}/view/`, {
    method: 'POST',
  });
  return response.json();
}

// Category operations
export async function fetchCategories(): Promise<Category[]> {
  const response = await makeRequest(`${API_BASE}/api/blog/categories/`);
  return response.json();
}

export async function createCategory(data: { name: string; description?: string; icon?: string; order?: number }): Promise<Category> {
  const response = await makeRequest(`${API_BASE}/api/blog/categories/create/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

// Tag operations
export async function fetchTags(): Promise<Tag[]> {
  const response = await makeRequest(`${API_BASE}/api/blog/tags/`);
  return response.json();
}

export async function createTag(data: { name: string }): Promise<Tag> {
  const response = await makeRequest(`${API_BASE}/api/blog/tags/create/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

