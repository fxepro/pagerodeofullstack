"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Lock, Mail, UserPlus, ArrowLeft } from "lucide-react";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    role: "viewer",
    demoPlan: "none"  // "none", "analyst", "auditor", "manager", "director", "executive"
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      // Create user via public registration endpoint
      const res = await axios.post(`${API_BASE}/api/register/`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        demo_plan: formData.demoPlan !== "none" ? formData.demoPlan : null
      });

      // Auto-login after successful registration
      const loginRes = await axios.post(`${API_BASE}/api/token/`, {
        username: formData.username,
        password: formData.password,
      });

      localStorage.setItem("access_token", loginRes.data.access);
      localStorage.setItem("refresh_token", loginRes.data.refresh);

      // Redirect to appropriate dashboard
      const userRes = await axios.get(`${API_BASE}/api/user-info/`, {
        headers: { Authorization: `Bearer ${loginRes.data.access}` },
      });

      // Check if email verification is required
      const emailVerified = res.data.email_verified ?? false;
      
      if (!emailVerified) {
        // Redirect to verification page with email in URL
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        // Redirect to workspace (unified dashboard) for all users
        router.push("/workspace");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Handle different error types
      if (err.response?.data?.error) {
        // Backend returned specific error message
        setError(err.response.data.error);
      } else if (err.response?.data?.username) {
        setError("Username already exists. Please choose a different one.");
      } else if (err.response?.data?.email) {
        setError("Email already exists. Please use a different email.");
      } else if (err.message?.includes('Network Error') || err.code === 'ECONNREFUSED') {
        setError("Cannot connect to server. Please check if the backend is running.");
      } else if (err.response?.status === 429) {
        setError("Too many registration attempts. Please try again later.");
      } else {
        setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-palette-primary rounded-xl mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <p className="text-slate-600 text-lg">Create your account to get started</p>
        </div>

        {/* Registration Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-center">
              <UserPlus className="h-6 w-6 mr-2" />
              Create Account
            </CardTitle>
            <CardDescription className="text-slate-600">
              Fill in your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-slate-700 font-medium">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="John"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-slate-700 font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-700 font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    className="pl-10 bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-700 font-medium">
                  Account Type
                </Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Basic access</SelectItem>
                    <SelectItem value="analyst">Analyst - Advanced features</SelectItem>
                    <SelectItem value="auditor">Auditor - Audit and reporting</SelectItem>
                    <SelectItem value="manager">Manager - Management tools</SelectItem>
                    <SelectItem value="director">Director - Executive access</SelectItem>
                    <SelectItem value="executive">Executive - Strategic planning</SelectItem>
                    <SelectItem value="agency">Agency - Agency management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Fields */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1"
                    required
                  />
                </div>
              </div>

              {/* Demo Access Request */}
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Label htmlFor="demoPlan" className="text-slate-700 font-medium">
                  Request Demo Access (Optional)
                </Label>
                <p className="text-xs text-slate-500 mb-3">
                  Get instant access to a demo account with pre-loaded sample data. Demo credentials will be sent to your email.
                </p>
                <Select 
                  value={formData.demoPlan} 
                  onValueChange={(value) => setFormData({ ...formData, demoPlan: value })}
                >
                  <SelectTrigger className="bg-white/60 border-palette-accent-2/50 focus:border-palette-accent-1 focus:ring-palette-accent-1">
                    <SelectValue placeholder="Select demo plan (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No demo access</SelectItem>
                    <SelectItem value="viewer">Viewer Plan Demo</SelectItem>
                    <SelectItem value="analyst">Analyst Plan Demo</SelectItem>
                    <SelectItem value="auditor">Auditor Plan Demo</SelectItem>
                    <SelectItem value="manager">Manager Plan Demo</SelectItem>
                    <SelectItem value="director">Director Plan Demo</SelectItem>
                    <SelectItem value="executive">Executive Plan Demo</SelectItem>
                    <SelectItem value="agency">Agency Plan Demo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-palette-primary hover:bg-palette-primary-hover text-white py-2.5 font-medium disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-600 text-sm">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="text-palette-primary hover:text-palette-primary-hover font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link 
                href="/" 
                className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
