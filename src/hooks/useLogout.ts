import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { logout as logoutApi } from "@/apis/auth.api";
import { beginLogout, endLogout } from "@/lib/authSession";
import { logout as logoutAction, completeLogout } from "@/redux/slices/authSlice";
import { clearBranches } from "@/redux/slices/branchSlice";
import { useAppDispatch } from "@/redux/hooks";

export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onMutate: () => {
      beginLogout();
      dispatch(logoutAction());
      dispatch(clearBranches());
      queryClient.cancelQueries();
      navigate("/login", { replace: true });
    },
    onSettled: () => {
      queryClient.removeQueries();
      dispatch(completeLogout());
      endLogout();
    },
  });
}
