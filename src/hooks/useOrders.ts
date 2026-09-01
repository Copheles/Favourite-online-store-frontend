import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addOrderPayment,
  exchangeOrder,
  getOrder,
  getOrderReceipt,
  listOrders,
  updateOrderStatus,
  type ListOrdersParams,
} from "@/apis/order.api";
import type { AddOrderPaymentInput, ExchangeOrderInput, OrderStatus } from "@/types/api";
import { STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";
import { useBranch } from "@/hooks/useBranch";

function invalidateOrderSideEffects(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
  queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
}

export function useOrders(params: Omit<ListOrdersParams, "branchId"> = {}) {
  const { isAuthenticated } = useAuth();
  const { currentBranchId } = useBranch();
  
  return useQuery({
    queryKey: queryKeys.orders.list({ ...params, branchId: currentBranchId }),
    queryFn: () => listOrders({ ...params, branchId: currentBranchId }),
    staleTime: STALE_TIME.transactional,
    enabled: isAuthenticated && !!currentBranchId,
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ""),
    queryFn: () => getOrder(id!),
    enabled: !!id,
    staleTime: STALE_TIME.transactional,
  });
}

export function useOrderReceipt(id: string | null) {
  return useQuery({
    queryKey: queryKeys.orders.receipt(id ?? ""),
    queryFn: () => getOrderReceipt(id!),
    enabled: !!id,
    staleTime: STALE_TIME.transactional,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: Extract<OrderStatus, "COMPLETED" | "CANCELLED">;
    }) => updateOrderStatus(id, status),
    onSuccess: () => invalidateOrderSideEffects(queryClient),
  });
}

export function useAddOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: AddOrderPaymentInput;
    }) => addOrderPayment(id, input),
    onSuccess: () => invalidateOrderSideEffects(queryClient),
  });
}

export function useExchangeOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ExchangeOrderInput;
    }) => exchangeOrder(id, input),
    onSuccess: () => invalidateOrderSideEffects(queryClient),
  });
}

export function useCurrentOrderCount() {
  const { isAuthenticated } = useAuth();
  const { currentBranchId } = useBranch();
  return useQuery({
    queryKey: queryKeys.orders.futureCount(currentBranchId),
    queryFn: () =>
      listOrders({
        branchId: currentBranchId,
        futureOnly: true,
        page: 1,
        limit: 1,
      }),
    select: (data) => data.meta.total,
    staleTime: STALE_TIME.transactional,
    enabled: isAuthenticated && !!currentBranchId,
  });
}

export function usePrefetchCurrentOrders() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { currentBranchId } = useBranch();
  return () => {
    if (!isAuthenticated || !currentBranchId) return;
    queryClient.prefetchQuery({
      queryKey: queryKeys.orders.list({
        branchId: currentBranchId,
        futureOnly: true,
        page: 1,
        limit: 20,
      }),
      queryFn: () =>
        listOrders({
          branchId: currentBranchId,
          futureOnly: true,
          page: 1,
          limit: 20,
        }),
      staleTime: STALE_TIME.transactional,
    });
  };
}
