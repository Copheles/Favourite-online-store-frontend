import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { changePassword, createStaff } from "@/apis/admin.api";
import { createCategory, listCategories } from "@/apis/category.api";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
  type ListExpensesParams,
} from "@/apis/expense.api";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
  type ListProductsParams,
} from "@/apis/product.api";
import { createStockMovement } from "@/apis/stockMovement.api";
import type {
  CategoryInput,
  ChangePasswordInput,
  ExpenseInput,
  Product,
  ProductInput,
  StaffInput,
} from "@/types/api";
import { STALE_TIME } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import type { ProductFormValues } from "@/validation/settings.validation";
import { useBranch } from "./useBranch";

export function useProducts(params: Omit<ListProductsParams, "branchId"> = {}) {
  const { currentBranchId } = useBranch();
  
  return useQuery({
    queryKey: queryKeys.products.list({ ...params, branchId: currentBranchId }),
    queryFn: () => listProducts({ ...params, branchId: currentBranchId }),
    staleTime: STALE_TIME.catalog,
    enabled: !!currentBranchId,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: queryKeys.products.detail(id ?? ""),
    queryFn: () => getProductById(id!),
    enabled: Boolean(id),
    staleTime: STALE_TIME.catalog,
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ProductInput>;
    }) => updateProduct(id, input),
    onSuccess: () => invalidateCatalogQueries(queryClient),
  });
}

export function useCategories(type?: "TOP" | "SUB") {
  return useQuery({
    queryKey: queryKeys.categories.list(type),
    queryFn: () =>
      listCategories({ type, isActive: true, page: 1, limit: 200 }),
    staleTime: STALE_TIME.static,
  });
}

export function useExpenses(params: Omit<ListExpensesParams, "branchId"> = {}) {
  const { currentBranchId } = useBranch();
  
  return useQuery({
    queryKey: queryKeys.expenses.list({ ...params, branchId: currentBranchId }),
    queryFn: () => listExpenses({ ...params, branchId: currentBranchId }),
    staleTime: STALE_TIME.transactional,
    enabled: !!currentBranchId,
  });
}

function invalidateCatalogQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.stock.all });
}

export function useCreateProductWithStock() {
  const queryClient = useQueryClient();
  const { currentBranchId } = useBranch();

  return useMutation({
    mutationFn: async (values: ProductFormValues): Promise<Product> => {
      const productInput: ProductInput = {
        name: values.name,
        code: values.code,
        barcode: values.barcode?.trim() || null,
        sellingPrice: values.sellingPrice,
        discount: values.discount || 0,
        topCategoryId: values.topCategoryId,
        subCategoryId: values.subCategoryId,
        availability: "AVAILABLE",
        type: "STOCK_CONTROL",
      };

      const product = await createProduct(productInput);

      if (values.initialStockQty > 0) {
        await createStockMovement({
          productId: product.id,
          branchId: currentBranchId,
          type: "IN",
          quantity: values.initialStockQty,
          buyPrice: values.buyPrice > 0 ? values.buyPrice : null,
          note: "Initial stock on product create",
        });
      }

      return product;
    },
    onSuccess: () => invalidateCatalogQueries(queryClient),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useAdminMutations() {
  const queryClient = useQueryClient();
  const invalidateExpenses = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  const invalidateReports = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });

  return {
    createProduct: useMutation({
      mutationFn: (input: ProductInput) => createProduct(input),
      onSuccess: () => invalidateCatalogQueries(queryClient),
    }),
    updateProduct: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
        updateProduct(id, input),
      onSuccess: () => invalidateCatalogQueries(queryClient),
    }),
    deleteProduct: useMutation({
      mutationFn: (id: string) => deleteProduct(id),
      onSuccess: () => invalidateCatalogQueries(queryClient),
    }),
    createExpense: useMutation({
      mutationFn: (input: ExpenseInput) => createExpense(input),
      onSuccess: () => {
        invalidateExpenses();
        invalidateReports();
      },
    }),
    updateExpense: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<ExpenseInput> }) =>
        updateExpense(id, input),
      onSuccess: () => {
        invalidateExpenses();
        invalidateReports();
      },
    }),
    deleteExpense: useMutation({
      mutationFn: (id: string) => deleteExpense(id),
      onSuccess: () => {
        invalidateExpenses();
        invalidateReports();
      },
    }),
    createStaff: useMutation({
      mutationFn: (input: StaffInput) => createStaff(input),
    }),
    changePassword: useMutation({
      mutationFn: (input: ChangePasswordInput) => changePassword(input),
    }),
  };
}
