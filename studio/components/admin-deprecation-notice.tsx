"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, X } from "lucide-react";

interface AdminDeprecationNoticeProps {
  redirectPath: string;
  delay?: number;
}

// Route mapping from admin to workspace
const ADMIN_TO_WORKSPACE_MAP: Record<string, string> = {
  '/admin': '/workspace',
  '/admin/login': '/workspace/login',
  '/admin/dashboard': '/workspace/admin-overview',
  '/admin/users': '/workspace/users',
  '/admin/roles': '/workspace/roles',
  '/admin/themes': '/workspace/themes',
  '/admin/feedback': '/workspace/feedback',
  '/admin/analytics': '/workspace/analytics',
  '/admin/monitoring': '/workspace/monitoring',
  '/admin/api-monitoring': '/workspace/api-monitoring',
  '/admin/tools-management': '/workspace/tools-management',
  '/admin/financials': '/workspace/financials',
  '/admin/marketing': '/workspace/marketing',
  '/admin/system-settings': '/workspace/system-settings',
};

export function AdminDeprecationNotice({ redirectPath, delay = 3000 }: AdminDeprecationNoticeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [countdown, setCountdown] = useState(delay / 1000);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router, redirectPath, dismissed]);

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 border-2 border-amber-400">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Admin App Deprecated</h2>
              <p className="text-sm text-slate-600 mt-1">
                The admin app has been deprecated. Please use the unified workspace instead.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDismissed(true);
              router.push(redirectPath);
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-slate-700">
            <strong>Redirecting to:</strong>
          </p>
          <p className="text-sm font-mono text-slate-600 bg-white px-3 py-2 rounded border">
            {redirectPath}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-600">
            Redirecting in <strong>{countdown}</strong> seconds...
          </p>
          <button
            onClick={() => {
              setDismissed(true);
              router.push(redirectPath);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium"
          >
            <span>Go Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to get workspace path from admin path
export function getWorkspacePath(adminPath: string): string {
  // Exact match first
  if (ADMIN_TO_WORKSPACE_MAP[adminPath]) {
    return ADMIN_TO_WORKSPACE_MAP[adminPath];
  }

  // Try to find closest match (for nested routes)
  const normalizedPath = adminPath.endsWith('/') ? adminPath.slice(0, -1) : adminPath;
  if (ADMIN_TO_WORKSPACE_MAP[normalizedPath]) {
    return ADMIN_TO_WORKSPACE_MAP[normalizedPath];
  }

  // Default to workspace root
  return '/workspace';
}
