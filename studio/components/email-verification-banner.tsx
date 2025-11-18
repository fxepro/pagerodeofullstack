"use client";
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Mail, RefreshCw, CheckCircle } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Use relative URL in production (browser), localhost in dev (SSR)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== 'undefined' ? '' : 'http://localhost:8000');

export function EmailVerificationBanner() {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resending, setResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkVerificationStatus();
    // Check status every 30 seconds in case user verifies in another tab
    const interval = setInterval(checkVerificationStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkVerificationStatus = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE}/api/auth/verification-status/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmailVerified(res.data.email_verified);
      if (res.data.email_verified) {
        localStorage.removeItem("email_verified");
      } else {
        localStorage.setItem("email_verified", "false");
      }
    } catch (err) {
      // Silent fail - don't show banner if we can't check
      console.error("Failed to check verification status:", err);
    }
  };

  const handleResend = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Please log in to resend verification email");
      return;
    }

    setResending(true);
    try {
      await axios.post(
        `${API_BASE}/api/auth/resend-verification/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Verification email sent! Please check your inbox.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = () => {
    router.push("/verify-email");
  };

  // Don't show if dismissed, verified, or not checked yet
  if (dismissed || emailVerified === true || emailVerified === null) {
    return null;
  }

  // Only show if explicitly unverified
  if (emailVerified === false) {
    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <Mail className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Email Verification Required</AlertTitle>
        <AlertDescription className="text-yellow-700">
          <div className="flex items-center justify-between">
            <span>Please verify your email address to access all features.</span>
            <div className="flex gap-2 mt-2">
              <Button
                onClick={handleVerify}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Verify Now
              </Button>
              <Button
                onClick={handleResend}
                size="sm"
                variant="outline"
                disabled={resending}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                {resending ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Email"
                )}
              </Button>
              <Button
                onClick={() => setDismissed(true)}
                size="sm"
                variant="ghost"
                className="text-yellow-700 hover:bg-yellow-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

