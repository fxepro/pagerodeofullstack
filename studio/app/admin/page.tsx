"use client";
import { useEffect } from "react";

export default function AdminRedirect() {
  useEffect(() => {
    // Redirect to admin login
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to admin login...</p>
    </div>
  );
}

