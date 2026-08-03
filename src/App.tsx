import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ProtectedRoute,
  PublicOnlyRoute,
  SuperAdminRoute,
  NonMonitorRoute,
  OwnerRoute,
} from "@/routes/ProtectedRoute";
import { LoadingState } from "@/components/shared/PageStates";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SalePage = lazy(() =>
  import("@/pages/SalePage").then((m) => ({ default: m.SalePage })),
);
const StockPage = lazy(() =>
  import("@/pages/StockPage").then((m) => ({ default: m.StockPage })),
);
const ProductsPage = lazy(() =>
  import("@/pages/ProductsPage").then((m) => ({ default: m.ProductsPage })),
);
const ProductCreatePage = lazy(() =>
  import("@/pages/ProductCreatePage").then((m) => ({
    default: m.ProductCreatePage,
  })),
);
const ExpensesPage = lazy(() =>
  import("@/pages/ExpensesPage").then((m) => ({ default: m.ExpensesPage })),
);
const OrdersPage = lazy(() =>
  import("@/pages/OrdersPage").then((m) => ({ default: m.OrdersPage })),
);
const CustomersPage = lazy(() =>
  import("@/pages/CustomersPage").then((m) => ({ default: m.CustomersPage })),
);
const OutstandingPage = lazy(() =>
  import("@/pages/OutstandingPage").then((m) => ({
    default: m.OutstandingPage,
  })),
);
const SaleReportPage = lazy(() =>
  import("@/pages/SaleReportPage").then((m) => ({ default: m.SaleReportPage })),
);
const SummaryReportPage = lazy(() =>
  import("@/pages/SummaryReportPage").then((m) => ({
    default: m.SummaryReportPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const UserManagementPage = lazy(() =>
  import("@/pages/UserManagementPage").then((m) => ({
    default: m.UserManagementPage,
  })),
);
const BranchManagementPage = lazy(() =>
  import("@/pages/BranchManagementPage").then((m) => ({
    default: m.BranchManagementPage,
  })),
);
const HelpCenterPage = lazy(() =>
  import("@/pages/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })),
);
const OwnerIntegrationPage = lazy(() =>
  import("@/pages/OwnerIntegrationPage").then((m) => ({
    default: m.OwnerIntegrationPage,
  })),
);

export default function App() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route element={<NonMonitorRoute />}>
              <Route path="/sale" element={<SalePage />} />
            </Route>
            <Route path="/stock" element={<StockPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/create" element={<ProductCreatePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/pending" element={<OrdersPage />} />
            <Route path="/orders/completed" element={<OrdersPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route
              path="/customers/outstanding"
              element={<OutstandingPage />}
            />
            <Route path="/reports/sale" element={<SaleReportPage />} />
            <Route path="/reports/summary" element={<SummaryReportPage />} />
            <Route element={<OwnerRoute />}>
              <Route path="/owner/integration" element={<OwnerIntegrationPage />} />
            </Route>
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route element={<SuperAdminRoute />}>
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/branches" element={<BranchManagementPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
