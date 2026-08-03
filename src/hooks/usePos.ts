import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkout } from "@/apis/checkout.api";
import { listCustomers } from "@/apis/customer.api";
import {
  listPosProducts,
  type ListPosProductsParams,
} from "@/apis/pos.api";
import type { CheckoutInput } from "@/types/api";
import { PAGE_SIZE, STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { useBranch } from "./useBranch";
import { useAuth } from "./useAuth";

type PosProductsOptions = {
  keepPrevious?: boolean;
  enabled?: boolean;
};

/** Sale catalog + checkout use the active branch (staff/admin locked to home). */
function useSaleBranchId() {
  const { currentBranchId, defaultBranchId } = useBranch();
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return defaultBranchId;
  }
  return currentBranchId ?? defaultBranchId;
}

export function usePosProducts(
  params: ListPosProductsParams = {},
  options: PosProductsOptions = {},
) {
  const { keepPrevious = true, enabled = true } = options;
  const saleBranchId = useSaleBranchId();
  const { branchId: branchIdOverride, ...rest } = params;
  const branchId = branchIdOverride ?? saleBranchId;

  return useQuery({
    queryKey: queryKeys.pos.list({ ...rest, branchId }),
    queryFn: () => listPosProducts({ ...rest, branchId }),
    staleTime: STALE_TIME.transactional,
    enabled: enabled && !!branchId,
    ...(keepPrevious
      ? {
          placeholderData: (
            prev: Awaited<ReturnType<typeof listPosProducts>> | undefined,
          ) => prev,
        }
      : {}),
  });
}

/** Exact barcode lookup — never reuse stale catalog data. */
export function useBarcodeLookup() {
  const saleBranchId = useSaleBranchId();

  return useMutation({
    mutationFn: (barcode: string) =>
      listPosProducts({ branchId: saleBranchId, barcode, page: 1, limit: 1 }),
  });
}

export function usePrefetchSaleData() {
  const queryClient = useQueryClient();
  const saleBranchId = useSaleBranchId();

  return () => {
    if (!saleBranchId) return;

    queryClient.prefetchQuery({
      queryKey: queryKeys.customers.list({
        page: 1,
        limit: 100,
        isActive: true,
        branchId: saleBranchId,
      }),
      queryFn: () =>
        listCustomers({
          page: 1,
          limit: 100,
          isActive: true,
          branchId: saleBranchId,
        }),
      staleTime: STALE_TIME.catalog,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.pos.list({
        branchId: saleBranchId,
        page: 1,
        limit: PAGE_SIZE.saleProducts,
      }),
      queryFn: () =>
        listPosProducts({
          branchId: saleBranchId,
          page: 1,
          limit: PAGE_SIZE.saleProducts,
        }),
      staleTime: STALE_TIME.transactional,
    });
  };
}

export function useCheckout() {
  const queryClient = useQueryClient();
  const saleBranchId = useSaleBranchId();

  return useMutation({
    mutationFn: (input: Omit<CheckoutInput, "branchId">) =>
      checkout({ ...input, branchId: saleBranchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
}

export { useLogout } from "./useLogout";
