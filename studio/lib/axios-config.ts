/**
 * Axios configuration with global interceptors
 * Handles authentication errors and session timeouts
 */

import axios from 'axios';

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE,
});

// Request interceptor - add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors globally
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - session expired or invalid token
    if (error.response?.status === 401) {
      // Clear tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Only redirect if we're not already on login/register/verify-email pages
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && 
            !currentPath.includes('/register') && 
            !currentPath.includes('/verify-email')) {
          // Redirect to login with error message
          const errorMessage = encodeURIComponent('Your session has expired or you have been logged out. Please log in again.');
          window.location.href = `/login?error=${errorMessage}`;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

