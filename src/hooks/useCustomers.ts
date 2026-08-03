import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  getCustomer,
  listCustomers,
  listOutstandingCustomers,
  updateCustomer,
  type ListCustomersParams,
  type ListOutstandingParams,
} from "@/apis/customer.api";
import type { Customer, CustomerInput } from "@/types/api";
import { STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { useBranch } from "./useBranch";

export function useCustomers(
  params: Omit<ListCustomersParams, "branchId"> = {},
  options?: { enabled?: boolean },
) {
  const { currentBranchId } = useBranch();

  return useQuery({
    queryKey: queryKeys.customers.list({
      ...params,
      branchId: currentBranchId,
    }),
    queryFn: () =>
      listCustomers({ ...params, branchId: currentBranchId ?? undefined }),
    staleTime: STALE_TIME.catalog,
    placeholderData: (prev) => prev,
    enabled: (options?.enabled ?? true) && !!currentBranchId,
  });
}

export function useOutstandingCustomers(
  params: Omit<ListOutstandingParams, "branchId"> = {},
) {
  const { currentBranchId } = useBranch();

  return useQuery({
    queryKey: queryKeys.customers.outstanding({
      ...params,
      branchId: currentBranchId,
    }),
    queryFn: () =>
      listOutstandingCustomers({
        ...params,
        branchId: currentBranchId ?? undefined,
      }),
    staleTime: STALE_TIME.transactional,
    placeholderData: (prev) => prev,
    enabled: !!currentBranchId,
  });
}

export function useCustomer(id: string | undefined) {
  const { currentBranchId } = useBranch();

  return useQuery({
    queryKey: queryKeys.customers.detail(id ?? ""),
    queryFn: () => getCustomer(id!, currentBranchId ?? undefined),
    staleTime: STALE_TIME.catalog,
    enabled: Boolean(id) && !!currentBranchId,
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useBranch();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });

  const create = useMutation({
    mutationFn: (input: CustomerInput) =>
      createCustomer(input, currentBranchId ?? undefined),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CustomerInput> }) =>
      updateCustomer(id, input, currentBranchId ?? undefined),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.all });
      const snapshots = queryClient.getQueriesData<{
        items: Customer[];
      }>({ queryKey: queryKeys.customers.all });

      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          items: data.items.map((c) =>
            c.id === id ? { ...c, ...input } : c,
          ),
        });
      });

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      deleteCustomer(id, currentBranchId ?? undefined),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
