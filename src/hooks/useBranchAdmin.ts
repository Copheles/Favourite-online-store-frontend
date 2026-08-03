import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManagedBranch,
  listManagedBranches,
  updateManagedBranch,
  type CreateBranchInput,
  type UpdateBranchInput,
} from "@/apis/branchAdmin.api";
import { STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";

export function useManagedBranches() {
  return useQuery({
    queryKey: queryKeys.managedBranches.list(),
    queryFn: listManagedBranches,
    staleTime: STALE_TIME.transactional,
  });
}

export function useBranchAdminMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.managedBranches.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.branches.accessible() });
  };

  return {
    create: useMutation({
      mutationFn: (input: CreateBranchInput) => createManagedBranch(input),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateBranchInput }) =>
        updateManagedBranch(id, input),
      onSuccess: invalidate,
    }),
  };
}
