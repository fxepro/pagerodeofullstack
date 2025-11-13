"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, LogIn } from "lucide-react";
import { captureEvent, identifyUser } from "@/lib/posthog";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:8000/api/token/", {
        username,
        password,
      });
      localStorage.setItem("access_token", res.data.access);
      localStorage.setItem("refresh_token", res.data.refresh);
      
      // Fetch user info to check roles
      const userRes = await axios.get("http://localhost:8000/api/user-info/", {
        headers: { Authorization: `Bearer ${res.data.access}` },
      });
      
      // Track login event and identify user in PostHog
      captureEvent('user_logged_in', {
        username: username,
        role: userRes.data.role,
        timestamp: new Date().toISOString(),
      });
      
      // Identify user for PostHog analytics
      identifyUser(username, {
        role: userRes.data.role,
        email: userRes.data.email || '',
      });
      
      // Redirect Admin users to admin dashboard, others to regular dashboard
      if (userRes.data.role === 'admin') {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError("Invalid credentials. Please try again.");
      
      // Track failed login attempt
      captureEvent('user_login_failed', {
        username: username,
        error: err?.response?.status || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-palette-accent-3 via-palette-accent-2 to-palette-primary/70">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-palette-primary text-white rounded-xl shadow-lg mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">PageRodeo</h1>
          <p className="text-slate-600 mt-2">Welcome back! Please sign in to your account.</p>
        </div>

        {/* Login Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center">
              <LogIn className="h-6 w-6 mr-2" />
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-600">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="pl-10 bg-white/70 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                required
              />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 bg-white/70 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                required
              />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-palette-primary hover:bg-palette-primary-hover text-white py-2.5 font-medium shadow-md"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </form>

            {/* Registration Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-600 text-sm">
                Don't have an account?{" "}
                <Link 
                  href="/register" 
                  className="text-palette-primary hover:text-palette-primary-hover font-medium transition-colors"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
