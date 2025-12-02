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
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

function VerifyEmailContent() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();


  const handleVerify = useCallback(async (verifyToken?: string) => {
    const tokenToVerify = verifyToken || token;
    if (!tokenToVerify) {
      setError("Please enter a verification token or code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Detect if it's a code (format: XXX-XXX-XXX) or token (UUID format)
      // Codes have dashes and are shorter, tokens are UUIDs (longer, no dashes in middle)
      const isCode = tokenToVerify.includes('-') && tokenToVerify.length < 50;
      
      const res = await axios.post(`${API_BASE}/api/auth/verify-email/`, 
        isCode 
          ? { code: tokenToVerify }  // Send as code if it looks like a code
          : { token: tokenToVerify } // Otherwise send as token
      );

      if (res.data?.email_verified) {
        // If backend returned tokens, store them to auto-login
        if (res.data.access_token && res.data.refresh_token) {
          localStorage.setItem('access_token', res.data.access_token);
          localStorage.setItem('refresh_token', res.data.refresh_token);
          setSuccess(true);
          setTimeout(() => {
            router.push("/dashboard");
          }, 800);
          return;
        }
        // No tokens returned, show success then go to login
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || "Verification failed. Please try again.");
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    // Extract token and email from URL if present
    const tokenFromUrl = searchParams.get('token');
    const emailFromUrl = searchParams.get('email');
    
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Auto-verify if token is in URL (from email link)
      handleVerify(tokenFromUrl);
    }
  }, [searchParams, handleVerify]);

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address to resend verification email");
      return;
    }

    setResending(true);
    setError("");

    try {
      const resp = await axios.post(`${API_BASE}/api/auth/send-verification/`, {
        email: email,
      });
      
      // In DEBUG mode, backend may include token and verification_link to unblock local testing
      const dbgToken = resp.data?.token as string | undefined;
      const dbgLink = resp.data?.verification_link as string | undefined;
      
      // Log response for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log("Resend verification response:", resp.data);
        if (dbgToken) {
          console.log("DEBUG MODE: Verification token:", dbgToken);
          console.log("DEBUG MODE: Verification link:", dbgLink);
        }
      }
      
      if (dbgToken) {
        setToken(dbgToken);
        // Optionally auto-verify to streamline testing flow
        await handleVerify(dbgToken);
        return;
      }
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

  if (success && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-palette-accent-2/50 shadow-xl">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Verified!</h2>
            <p className="text-slate-600 mb-4">Your email has been verified successfully.</p>
            <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
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
              Please check your email and click the verification link
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

            <div className="space-y-2">
              <Label htmlFor="token" className="text-slate-700 font-medium">
                Verification code (paste if you have it)
              </Label>
              <p className="text-xs text-slate-500 mb-2">
                If you received a code or see one displayed here (dev mode), paste it to verify immediately.
              </p>
              <Input
                id="token"
                type="text"
                placeholder="Paste verification code here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-white/70 border-palette-accent-2/50 focus:border-palette-accent-1"
                disabled={loading || success}
              />
              {token && !success && (
                <Button
                  onClick={() => handleVerify()}
                  disabled={loading}
                  className="w-full bg-palette-primary hover:bg-palette-primary-hover text-white"
                >
                  {loading ? "Verifying..." : "Verify Now"}
                </Button>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
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

