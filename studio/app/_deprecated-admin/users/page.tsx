"use client";
import { AdminDeprecationNotice } from "@/components/admin-deprecation-notice";

/**
 * DEPRECATED: User Management
 * 
 * This page has been moved to /workspace/users
 */
export default function AdminUsersPage() {
  return <AdminDeprecationNotice redirectPath="/workspace/users" delay={2000} />;
}