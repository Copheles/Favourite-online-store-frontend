import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

function getRedirectPath(state: unknown, fallback: string) {
  const from = (state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;
  return from && from !== "/login" ? from : fallback;
}

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function SuperAdminRoute() {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function OwnerRoute() {
  const { isAuthenticated, isOwner } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function NonMonitorRoute() {
  const { isAuthenticated, isMonitor } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isMonitor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return (
      <Navigate to={getRedirectPath(location.state, "/dashboard")} replace />
    );
  }

  return <Outlet />;
}
