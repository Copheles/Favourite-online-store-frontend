import { useMemo } from "react";
import { useAppSelector } from "@/redux/hooks";
import {
  isBusinessAdminRole,
  isMonitorRole,
  isSuperAdminRole,
  hasStoreOperatorAccessRole,
  canPerformWrites,
} from "@/types/auth";

export function useAuth() {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const loggingOut = useAppSelector((state) => state.auth.loggingOut);

  return useMemo(() => {
    const role = user?.role?.toLowerCase();
    return {
      user,
      isAuthenticated,
      loggingOut,
      isSuperAdmin: isSuperAdminRole(user?.role),
      isOwner: role === "owner",
      isAdmin: role === "admin",
      isBusinessAdmin: isBusinessAdminRole(user?.role),
      hasStoreOperatorAccess: hasStoreOperatorAccessRole(user?.role),
      isStaff: role === "staff",
      isMonitor: isMonitorRole(user?.role),
      canWrite: canPerformWrites(user?.role),
    };
  }, [user, isAuthenticated, loggingOut]);
}
