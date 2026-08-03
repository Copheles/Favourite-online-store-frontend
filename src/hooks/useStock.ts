import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStockMovement,
  listStockMovements,
  type CreateStockMovementInput,
  type ListStockMovementsParams,
} from "@/apis/stockMovement.api";
import {
  getInventoryBalance,
  type InventoryBalanceParams,
} from "@/apis/report.api";
import {
  exportProductsExcel,
  importProductsExcel,
  type ExportProductsExcelParams,
} from "@/apis/product.api";
import { STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { useBranch } from "./useBranch";

export function useInventoryBalance(params: Omit<InventoryBalanceParams, "branchId"> = {}) {
  const { currentBranchId } = useBranch();
  
  return useQuery({
    queryKey: queryKeys.stock.balance({ ...params, branchId: currentBranchId }),
    queryFn: () => getInventoryBalance({ ...params, branchId: currentBranchId }),
    staleTime: STALE_TIME.reports,
    placeholderData: (prev) => prev,
    enabled: !!currentBranchId,
  });
}

export function useStockMovements(params: Omit<ListStockMovementsParams, "branchId"> = {}) {
  const { currentBranchId } = useBranch();
  
  return useQuery({
    queryKey: queryKeys.stock.movements({ ...params, branchId: currentBranchId }),
    queryFn: () => listStockMovements({ ...params, branchId: currentBranchId }),
    staleTime: STALE_TIME.transactional,
    placeholderData: (prev) => prev,
    enabled: !!currentBranchId,
  });
}

export function useStockMovementMutation() {
  const queryClient = useQueryClient();
  const { currentBranchId, switchBranch } = useBranch();
  return useMutation({
    mutationFn: (input: CreateStockMovementInput) =>
      createStockMovement({ ...input, branchId: input.branchId ?? currentBranchId }),
    onSuccess: (_data, variables) => {
      const restockedBranchId = variables.branchId ?? currentBranchId;
      if (restockedBranchId && restockedBranchId !== currentBranchId) {
        switchBranch(restockedBranchId);
      }
      const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
        queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
        queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      };
      if (restockedBranchId && restockedBranchId !== currentBranchId) {
        window.setTimeout(invalidate, 0);
      } else {
        invalidate();
      }
    },
  });
}

function invalidateStockCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
  queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
}

export function useProductExcelImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, dryRun = false }: { file: File; dryRun?: boolean }) =>
      importProductsExcel(file, dryRun),
    onSuccess: (_result, variables) => {
      if (!variables.dryRun) {
        invalidateStockCatalog(queryClient);
      }
    },
  });
}

export function useProductExcelExport() {
  return useMutation({
    mutationFn: (params: ExportProductsExcelParams) => exportProductsExcel(params),
  });
}
