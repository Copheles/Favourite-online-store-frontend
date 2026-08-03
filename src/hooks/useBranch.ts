import { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/redux/store";
import { switchBranch } from "@/redux/slices/branchSlice";
import { useAuth } from "./useAuth";
import { isMonitorRole } from "@/types/auth";

export function useBranch() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, hasStoreOperatorAccess, canWrite } = useAuth();
  const currentBranchId = useSelector((state: RootState) => state.branch.currentBranchId);
  const accessibleBranches = useSelector((state: RootState) => state.branch.accessibleBranches);

  return useMemo(() => {
    const isMonitor = isMonitorRole(user?.role);
    const canSwitch = hasStoreOperatorAccess || isMonitor;
    const resolvedId =
      (canSwitch
        ? (currentBranchId ?? user?.defaultBranchId)
        : (user?.defaultBranchId ?? currentBranchId)) ?? undefined;

    const currentBranch = accessibleBranches.find(
      (b) => b.id === resolvedId,
    );

    const isDefaultBranch = resolvedId === user?.defaultBranchId;
    const canWriteCatalog = Boolean(canWrite && hasStoreOperatorAccess && isDefaultBranch);

    return {
      currentBranchId: resolvedId,
      currentBranch,
      accessibleBranches,
      defaultBranchId: user?.defaultBranchId,
      isDefaultBranch,
      canWrite: canWriteCatalog,
      canWriteCatalog,
      canRestock: Boolean(canWrite && hasStoreOperatorAccess && resolvedId),
      canManageExpenses: Boolean(canWrite && resolvedId && isDefaultBranch),
      canSwitchBranch: Boolean(canSwitch && accessibleBranches.length > 1),
      switchBranch: (branchId: string) => {
        if (!canSwitch) return;
        dispatch(switchBranch(branchId));
      },
    };
  }, [user, hasStoreOperatorAccess, canWrite, currentBranchId, accessibleBranches, dispatch]);
}
