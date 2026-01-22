"use client";

import React, { createContext, useContext } from "react";

interface PermissionContextType {
  user: any;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const PermissionContext = createContext<PermissionContextType | null>(null);

export function PermissionProvider({
  children,
  user,
  permissions,
}: {
  children: React.ReactNode;
  user: any;
  permissions: string[];
}) {
  const hasPermission = (permission: string): boolean => {
    if (user?.is_superuser) return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some(perm => hasPermission(perm));
  };

  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every(perm => hasPermission(perm));
  };

  return (
    <PermissionContext.Provider
      value={{
        user,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
}

