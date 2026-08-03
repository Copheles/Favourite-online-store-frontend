import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { login, getAccessibleBranches } from "@/apis/auth.api";
import { suppressUnauthorizedEvents } from "@/lib/authSession";
import { queryKeys } from "@/lib/queryKeys";
import { loginSuccess } from "@/redux/slices/authSlice";
import { setBranches } from "@/redux/slices/branchSlice";
import { useAppDispatch } from "@/redux/hooks";
import type { LoginFormValues } from "@/validation/login.validation";

function getRedirectPath(state: unknown, fallback: string) {
  const from = (state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;
  return from && from !== "/login" ? from : fallback;
}

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LoginFormValues) =>
      login({ username: values.username, password: values.password }),
    onSuccess: async (data) => {
      suppressUnauthorizedEvents(10_000);
      dispatch(loginSuccess(data.user));

      try {
        const branchData = await getAccessibleBranches();
        dispatch(setBranches(branchData));
      } catch (error) {
        console.error("Failed to fetch branch information:", error);
      }

      queryClient.resetQueries({ queryKey: queryKeys.auth.me(), exact: true });
      queryClient.setQueryData(queryKeys.auth.me(), data.user);

      navigate(getRedirectPath(location.state, "/dashboard"));
    },
  });
}
