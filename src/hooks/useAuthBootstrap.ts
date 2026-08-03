import { useLayoutEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { me, getAccessibleBranches } from "@/apis/auth.api";
import { STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setUser } from "@/redux/slices/authSlice";
import { setBranches, clearBranches } from "@/redux/slices/branchSlice";

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const loggingOut = useAppSelector((state) => state.auth.loggingOut);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => me(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !loggingOut,
    staleTime: STALE_TIME.auth,
    gcTime: STALE_TIME.auth,
  });

  const branchQuery = useQuery({
    queryKey: queryKeys.branches.accessible(),
    queryFn: () => getAccessibleBranches(),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !loggingOut && isAuthenticated,
    staleTime: STALE_TIME.auth,
    gcTime: STALE_TIME.auth,
  });

  useLayoutEffect(() => {
    if (loggingOut) return;

    if (query.isSuccess && query.data) {
      dispatch(setUser(query.data));
      
      // Set branch information if available
      if (branchQuery.isSuccess && branchQuery.data) {
        dispatch(setBranches(branchQuery.data));
      }
      return;
    }

    // Do not wipe a fresh login when the earlier /auth/me probe is still in error state.
    if (query.isError && !isAuthenticated) {
      dispatch(setUser(null));
      dispatch(clearBranches());
    }
  }, [
    loggingOut,
    query.isSuccess,
    query.isError,
    query.data,
    branchQuery.isSuccess,
    branchQuery.data,
    isAuthenticated,
    dispatch,
  ]);

  return query;
}
