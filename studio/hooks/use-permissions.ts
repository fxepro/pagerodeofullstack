import { usePermissions as usePermissionsContext } from "@/contexts/permission-context";

export function usePermissions() {
  return usePermissionsContext();
}

export function usePermissionGuard(permission: string) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) {
    throw new Error("Insufficient permissions");
  }
}

