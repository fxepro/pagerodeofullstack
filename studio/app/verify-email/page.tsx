"use client";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

// Use relative URL in production (browser), localhost in dev (SSR)
// Normalize API_BASE to avoid double slashes
const getApiBase = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');
  return base.endsWith('/') ? base.slice(0, -1) : base;
};
const API_BASE = getApiBase();

function VerifyEmailContent() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleVerify = useCallback(async (verifyCode?: string) => {
    const codeToVerify = (verifyCode || token || '').trim();
    if (!codeToVerify) {
      setError("Please enter a verification code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = { code: codeToVerify };
      const url = `${API_BASE}/api/auth/verify-email/`.replace(/\/+/g, '/').replace(':/', '://');
      
      const res = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.data?.email_verified) {
        // Email verified - redirect to login page
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1500); // Give user time to see success message
      }
    } catch (err: any) {
      console.error('Verification error:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        payload: err.config?.data,
        requestHeaders: err.config?.headers
      });
      
      // Log the full response for debugging
      if (err.response) {
        console.error('Full error response:', JSON.stringify(err.response.data, null, 2));
      }
      
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Verification failed. Please try again.";
      setError(errorMsg);
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    // Extract code/token and email from URL if present
    // Support both ?code= (new) and ?token= (old emails) for backward compatibility
    const codeFromUrl = searchParams.get('code') || searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
    
    // If code/token is in URL (from email link), verify immediately and redirect to login
    if (codeFromUrl) {
      // Set loading immediately to show loading screen
      setLoading(true);
      setToken(codeFromUrl);
      setError(""); // Clear any previous errors
      
      // Verify immediately without showing the form
      const verifyAndRedirect = async () => {
        try {
          const payload = { code: codeFromUrl };
          const url = `${API_BASE}/api/auth/verify-email/`.replace(/\/+/g, '/').replace(':/', '://');
          
          const res = await axios.post(url, payload, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          if (res.data?.email_verified) {
            // Email verified - redirect to login immediately (no delay)
            router.push("/login");
            return; // Don't set loading to false, let redirect happen
          } else {
            // Verification failed - show error on verify page
            setError("Verification failed. Please try again.");
            setLoading(false);
    }
        } catch (err: any) {
          // Verification failed - show error on verify page
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Verification failed. Please try again.";
          setError(errorMsg);
          setLoading(false);
        }
      };
      
      verifyAndRedirect();
    }
  }, [searchParams, router]);

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address to resend verification email");
      return;
    }

    setResending(true);
    setError("");

    try {
      const resp = await axios.post(`${API_BASE}/api/auth/resend-verification/`, {
        email: email,
      });
      
      setSuccess(true);
      setError("");
    } catch (err: any) {
      console.error("Resend verification error:", err);
      const apiMsg = err.response?.data?.error || err.message || "Failed to resend verification email. Please try again.";
      setError(apiMsg);
    } finally {
      setResending(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (!local || !domain) return email;
    const masked = local.substring(0, 1) + "***" + local.substring(local.length - 1);
    return `${masked}@${domain}`;
  };

  // If code/token is in URL (from email link), show minimal loading and redirect immediately after verification
  const codeFromUrl = searchParams.get('code') || searchParams.get('token');
  // Show loading screen if code is in URL (auto-verification flow from email link)
  // Don't show the form - just verify and redirect
  if (codeFromUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-xl">
          <CardContent className="pt-6 text-center">
            <RefreshCw className="h-16 w-16 text-palette-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifying Email...</h2>
            <p className="text-slate-600 mb-4">Please wait while we verify your email address.</p>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
                <p className="mt-2 text-xs">You can still enter your code manually below.</p>
              </div>
            )}
            {!error && <p className="text-sm text-slate-500">Redirecting to login...</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-palette-primary rounded-xl mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-slate-600">
              Check your email and click the verification link, or enter your code below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {email && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600 text-center">
                  Email sent to: <span className="font-medium">{maskEmail(email)}</span>
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-slate-500 text-center mt-1">
                    (DEBUG: {email})
                  </p>
                )}
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 text-sm text-center">
                  {token ? "Email verified successfully! Redirecting..." : "Verification email sent! Please check your inbox."}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Option 1: Enter Verification Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-slate-700 font-medium">
                Enter Verification Code
              </Label>
              <p className="text-xs text-slate-500 mb-2">
                Enter the verification code you received (format: ABC-123-XYZ)
              </p>
              <Input
                id="code"
                type="text"
                placeholder="ABC-123-XYZ"
                value={token}
                onChange={(e) => setToken(e.target.value.trim().toUpperCase())}
                onBlur={(e) => setToken(e.target.value.trim().toUpperCase())}
                maxLength={11}
                className="bg-white/70 border-palette-accent-2/50 focus:border-palette-accent-1"
                disabled={loading || success}
              />
              {token && !success && (
                <Button
                  onClick={() => {
                    const currentCode = (document.getElementById('code') as HTMLInputElement)?.value?.trim() || token.trim();
                    if (currentCode) {
                      handleVerify(currentCode);
                    } else {
                      setError("Please enter a verification code");
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-palette-primary hover:bg-palette-primary-hover text-white"
                >
                  {loading ? "Verifying..." : "Verify Now"}
                </Button>
              )}
            </div>

            {/* OR Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">OR</span>
              </div>
            </div>

            {/* Option 2: Resend Email */}
            <div className="pt-2">
              <p className="text-sm text-slate-600 mb-3 text-center">
                Didn't receive the email?
              </p>
              <div className="space-y-2">
                <Label htmlFor="resend-email" className="text-slate-700 font-medium">
                  Enter your email to resend:
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/70 border-palette-accent-2/50 focus:border-palette-accent-1"
                    disabled={resending}
                  />
                  <Button
                    onClick={handleResend}
                    disabled={resending || !email}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Resend"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-slate-500 hover:text-slate-700 text-sm transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-xl">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
