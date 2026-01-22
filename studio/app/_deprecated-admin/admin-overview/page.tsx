"use client";
import { AdminDeprecationNotice } from "@/components/admin-deprecation-notice";

/**
 * DEPRECATED: Admin Dashboard Overview
 * 
 * This page has been moved to /workspace/admin-overview
 */
export default function AdminDashboardOverviewPage() {
  return <AdminDeprecationNotice redirectPath="/workspace/admin-overview" delay={2000} />;
}