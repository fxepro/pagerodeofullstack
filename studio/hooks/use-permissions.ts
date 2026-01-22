import { useContext } from "react";
import { PermissionContext } from "@/contexts/permission-context";

export function usePermissions() {
  const context = useContext(PermissionContext);
  
  // If context is not available, return a default safe context
  if (!context) {
    return {
      user: null,
      permissions: [],
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
    };
  }
  
  return context;
}

export function usePermissionGuard(permission: string) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) {
    throw new Error("Insufficient permissions");
  }
}

