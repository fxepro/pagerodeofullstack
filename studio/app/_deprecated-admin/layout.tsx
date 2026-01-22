"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminDeprecationNotice, getWorkspacePath } from "@/components/admin-deprecation-notice";

/**
 * DEPRECATED: Admin Layout
 * 
 * This admin app has been deprecated in favor of the unified workspace.
 * All admin routes now redirect to their workspace equivalents.
 * 
 * Route mapping:
 * - /admin/login → /workspace/login
 * - /admin/dashboard → /workspace/admin-overview
 * - /admin/users → /workspace/users
 * - /admin/roles → /workspace/roles
 * - /admin/themes → /workspace/themes
 * - /admin/feedback → /workspace/feedback
 * - /admin/analytics → /workspace/analytics
 * - /admin/monitoring → /workspace/monitoring
 * - /admin/api-monitoring → /workspace/api-monitoring
 * - /admin/tools-management → /workspace/tools-management
 * - /admin/financials → /workspace/financials
 * - /admin/marketing → /workspace/marketing
 * - /admin/system-settings → /workspace/system-settings
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Get the workspace equivalent path
  const workspacePath = getWorkspacePath(pathname);

  // Show deprecation notice and redirect
  return <AdminDeprecationNotice redirectPath={workspacePath} delay={3000} />;
}
