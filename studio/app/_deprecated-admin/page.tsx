"use client";
import { AdminDeprecationNotice } from "@/components/admin-deprecation-notice";

/**
 * DEPRECATED: Admin Root Page
 * 
 * This page redirects to /workspace (the unified dashboard).
 * The admin app has been deprecated in favor of the workspace.
 */
export default function AdminRedirect() {
  return <AdminDeprecationNotice redirectPath="/workspace" delay={2000} />;
}

