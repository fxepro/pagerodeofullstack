"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, LogIn, UserPlus } from "lucide-react";
import { captureEvent, identifyUser } from "@/lib/posthog";
import { SimpleHeroSection } from "@/components/simple-hero-section";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function WorkspaceLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await axios.post(`${API_BASE}/api/token/`, {
        username,
        password,
      });
      
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      
      // Clear orchestrator state on login to ensure fresh start
      localStorage.removeItem("pagerodeo_analysis_state");
      
      // Fetch user info to check roles
      const userRes = await axios.get(`${API_BASE}/api/user-info/`, {
        headers: { Authorization: `Bearer ${res.data.access}` },
      });
      
      // Track login event and identify user in PostHog
      captureEvent('user_logged_in', {
        username: username,
        role: userRes.data.role,
        timestamp: new Date().toISOString(),
        login_type: 'workspace',
      });
      
      // Identify user for PostHog analytics
      identifyUser(username, {
        role: userRes.data.role,
        email: userRes.data.email,
      });
      
      // Check if there's a redirect URL (e.g., from checkout)
      const redirectUrl = sessionStorage.getItem('checkout_redirect');
      if (redirectUrl) {
        sessionStorage.removeItem('checkout_redirect');
        router.push(redirectUrl);
      } else {
        // Redirect to workspace (new unified dashboard)
        router.push("/workspace");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || "Login failed. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 via-white to-palette-accent-3">
      <SimpleHeroSection
        title="Workspace Login"
        subtitle="Sign in to access your unified workspace and manage your website performance"
        gradientFrom="from-palette-primary"
        gradientVia="via-palette-primary"
        gradientTo="to-palette-secondary"
      />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Workspace Login</CardTitle>
          <CardDescription>
            Sign in to access your unified workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-palette-primary hover:bg-palette-primary-hover"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In to Workspace
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-palette-primary hover:underline font-medium inline-flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                Sign Up
              </Link>
            </p>
          </div>
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

