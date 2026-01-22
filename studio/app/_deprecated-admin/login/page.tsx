"use client";
import { AdminDeprecationNotice } from "@/components/admin-deprecation-notice";

/**
 * DEPRECATED: Admin Login Page
 * 
 * This admin login page has been deprecated.
 * Please use /workspace/login instead for the unified workspace.
 */

export default function AdminLoginPage() {
  return <AdminDeprecationNotice redirectPath="/workspace/login" delay={2000} />;
}

