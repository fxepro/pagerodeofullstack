"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

import { getDjangoApiUrl } from "@/lib/api-config";

function VerifyEmailContent() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract token from URL if present
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Auto-verify if token is in URL
      handleVerify(tokenFromUrl);
    }
  }, [searchParams]);

  const handleVerify = async (verifyToken?: string) => {
    const tokenToVerify = verifyToken || token;
    if (!tokenToVerify) {
      setError("Please enter a verification token");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await axios.post(getDjangoApiUrl('/api/auth/verify-email/'), {
        token: tokenToVerify,
      });

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
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email address to resend verification email");
      return;
    }

    setResending(true);
    setError("");

    try {
      const resp = await axios.post(getDjangoApiUrl('/api/auth/send-verification/'), {
        email: email,
      });
      // In DEBUG mode, backend may include token and verification_link to unblock local testing
      const dbgToken = resp.data?.token as string | undefined;
      const dbgLink = resp.data?.verification_link as string | undefined;
      if (dbgToken) {
        setToken(dbgToken);
        // Optionally auto-verify to streamline testing flow
        await handleVerify(dbgToken);
        return;
      }
      setSuccess(true);
      setError("");
    } catch (err: any) {
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
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-white/90 backdrop-blur-sm border-palette-accent-2/50 shadow-2xl">
          <CardContent className="pt-12 pb-12 px-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-slate-800">Email Verified!</h2>
              <p className="text-base text-slate-600">Your email has been verified successfully.</p>
              <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Card className="bg-white/90 backdrop-blur-sm border-palette-accent-2/50 shadow-2xl">
          <CardHeader className="text-center space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-palette-primary rounded-2xl">
                <Mail className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-bold text-slate-800">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Check your inbox and click the verification link we sent you
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-8">
            {email && (
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-base text-slate-700">
                  Email sent to: <span className="font-semibold">{maskEmail(email)}</span>
                </p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-base text-green-700">
                  {token ? "Email verified successfully! Redirecting..." : "Verification email sent! Please check your inbox."}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-base text-red-700 text-center">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Label htmlFor="token" className="text-lg text-slate-700 font-semibold block text-center">
                  Verification Code
                </Label>
                <p className="text-sm text-slate-500">
                  Paste your verification code here
                </p>
              </div>
              <Input
                id="token"
                type="text"
                placeholder="Enter verification code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="bg-white border-2 border-slate-200 focus:border-palette-primary text-center text-lg py-6"
                disabled={loading || success}
              />
              {token && !success && (
                <Button
                  onClick={() => handleVerify()}
                  disabled={loading}
                  className="w-full bg-palette-primary hover:bg-palette-primary-hover text-white py-6 text-lg font-semibold"
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </Button>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 space-y-4">
              <p className="text-base text-slate-600 text-center font-medium">
                Didn't receive the email?
              </p>
              <div className="space-y-3">
                <Label htmlFor="resend-email" className="text-base text-slate-700 font-medium text-center block">
                  Enter your email to resend
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-2 border-slate-200 focus:border-palette-primary text-center text-base py-6"
                    disabled={resending}
                  />
                  <Button
                    onClick={handleResend}
                    disabled={resending || !email}
                    variant="outline"
                    className="whitespace-nowrap px-6 py-6 text-base font-semibold border-2"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
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
                className="inline-flex items-center justify-center text-slate-600 hover:text-slate-800 text-base font-medium transition-colors gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
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
      <div className="min-h-screen bg-gradient-to-br from-palette-accent-3 to-palette-accent-2/80 flex items-center justify-center p-6">
        <Card className="bg-white/90 backdrop-blur-sm border-palette-accent-2/50 shadow-2xl">
          <CardContent className="pt-12 pb-12 px-8 text-center">
            <p className="text-base text-slate-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

