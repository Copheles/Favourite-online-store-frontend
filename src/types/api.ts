export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface CategoryRef {
  id: string;
  name: string;
  type: "TOP" | "SUB";
  parentId?: string | null;
}

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type DisplayStockStatus = StockStatus | "NEGATIVE_STOCK";
export type PaymentType = "CASH" | "KBZPAY" | "WAVEPAY" | "CARD" | "BANKING";
export type OrderStatus = "COMPLETED" | "PROCESSING" | "CANCELLED";
export type ProductType = "STOCK_CONTROL" | "NO_STOCK_CONTROL";
export type Availability = "AVAILABLE" | "UNAVAILABLE";

export interface PosProduct {
  productId: string;
  name: string;
  code: string;
  barcode: string | null;
  sellingPrice: number;
  discount: number;
  finalPrice: number;
  stockQty: number;
  stockStatus: StockStatus;
  isSellable: boolean;
  topCategory: CategoryRef;
  subCategory: CategoryRef;
}

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface CheckoutInput {
  branchId?: string;
  customerId?: string | null;
  items: CheckoutItemInput[];
  status?: OrderStatus;
  paymentType: PaymentType;
  paidAmount: number;
  orderDiscount?: number;
  deliveryFee?: number;
  taxAmount?: number;
  notes?: string | null;
  orderDate: string;
}

export interface OrderCustomer {
  id: string | null;
  name: string;
  phone: string | null;
}

export interface OrderCashier {
  id: string;
  username: string;
  displayName?: string | null;
  role: string;
}

export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export interface OrderListItem {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  dailySerial: number;
  customerName: string;
  subtotal: number;
  itemDiscount: number;
  orderDiscount: number;
  deliveryFee: number;
  taxAmount: number;
  netTotal: number;
  paymentType: PaymentType | null;
  paidTotal?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;
  status: OrderStatus;
  notes: string | null;
  orderDate: string;
  createdAt: string;
}

export interface OrderItemDetail {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  discount: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderPayment {
  id: string;
  paymentType: PaymentType;
  paidAmount: number;
  changeAmount: number;
  note?: string | null;
  createdAt: string;
}

export interface OrderTotals {
  subtotal: number;
  itemDiscount: number;
  orderDiscount: number;
  deliveryFee: number;
  taxAmount: number;
  netTotal: number;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  invoiceNumber: string;
  dailySerial?: number;
  date?: string;
  orderDate?: string;
  createdAt?: string;
  cashier?: OrderCashier | string | null;
  customer?: OrderCustomer;
  customerId?: string | null;
  items: OrderItemDetail[];
  payments?: OrderPayment[];
  payment?: OrderPayment;
  totals?: OrderTotals;
  subtotal?: number;
  itemDiscount?: number;
  orderDiscount?: number;
  deliveryFee?: number;
  taxAmount?: number;
  netTotal?: number;
  paidTotal?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;
  notes: string | null;
  status: OrderStatus;
}

export interface OutstandingOrder {
  id: string;
  invoiceNumber: string;
  netTotal: number;
  paidTotal: number;
  refundedTotal: number;
  balanceDue: number;
  createdAt: string;
}

export interface OutstandingItem {
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  order: OutstandingOrder;
}

export interface AddOrderPaymentInput {
  paymentType: PaymentType;
  paidAmount: number;
  note?: string | null;
}

export interface OrderReceipt {
  shopInfo: {
    name: string;
    address: string | null;
    phone: string | null;
    receiptPaperWidthMm?: number;
  };
  orderId: string;
  orderNumber?: string;
  invoiceNumber: string;
  dailySerial?: number;
  date: string;
  cashier?: OrderCashier | string | null;
  customer: OrderCustomer;
  isWalkIn?: boolean;
  items: Array<{
    productName: string;
    productCode: string;
    unitPrice: number;
    discount: number;
    unitPriceAfterDiscount: number;
    quantity: number;
    totalAmount: number;
  }>;
  totals: OrderTotals;
  payments: OrderPayment[];
  notes: string | null;
}

export interface Customer {
  id: string;
  branchId: string;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  pointsBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  isActive?: boolean;
}

export interface InventoryBalanceItem {
  productId: string;
  name: string;
  code: string;
  barcode: string | null;
  topCategory: CategoryRef;
  subCategory: CategoryRef;
  warehouseName: string;
  stockQty: number;
  sellingPrice: number;
  availability: Availability;
  stockStatus: StockStatus;
}

export interface InventoryBalanceResponse {
  items: InventoryBalanceItem[];
  summary: {
    totalProducts: number;
    totalStockQty: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  meta: PaginationMeta;
}

export interface SalesReportItem {
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  soldQty: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  averageBuyPrice: number;
  estimatedProfit: number;
}

export interface SalesReportResponse {
  items: SalesReportItem[];
  summary: {
    soldQty: number;
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    estimatedProfit: number;
  };
  meta: PaginationMeta;
}

export interface PaymentSummaryItem {
  paymentType: PaymentType;
  amount: number;
  count: number;
}

export interface CashSummaryResponse {
  date?: string;
  fromDate?: string;
  toDate?: string;
  salesTotal: number;
  itemDiscount: number;
  orderDiscount: number;
  deliveryFee: number;
  taxAmount: number;
  netSalesTotal: number;
  orderCount: number;
  soldItemQty: number;
  totalExpenses: number;
  expenseSummary: PaymentSummaryItem[];
  cashInHand: number;
  paymentSummary: PaymentSummaryItem[];
}

export interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string | null;
  sellingPrice: number;
  discount: number;
  unit: string | null;
  description: string | null;
  type: ProductType;
  availability: Availability;
  topCategoryId: string;
  subCategoryId: string;
  topCategory?: CategoryRef;
  subCategory?: CategoryRef;
  saleOrder: number;
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  code: string;
  barcode?: string | null;
  sellingPrice: number;
  discount?: number;
  unit?: string | null;
  description?: string | null;
  type?: ProductType;
  availability?: Availability;
  topCategoryId: string;
  subCategoryId: string;
  saleOrder?: number;
  isActive?: boolean;
}

export interface ProductExcelImportSummary {
  dryRun: boolean;
  totalRows: number;
  createdCategories: number;
  createdProducts: number;
  updatedProducts: number;
  stockQtyAdjusted: number;
  openingMovementsPlanned: number;
  openingMovementsCreated: number;
  negativeQtyRows: number;
  buyPriceResolvedRows: number;
  skippedRows: number;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export interface Category {
  id: string;
  name: string;
  type: "TOP" | "SUB";
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  type: "TOP" | "SUB";
  parentId?: string | null;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: string | null;
  paymentType: PaymentType;
  expenseDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  name: string;
  amount: number;
  paymentType: PaymentType;
  expenseDate: string;
  category?: string | null;
  note?: string | null;
}

export interface StaffInput {
  username: string;
  password: string;
  role: "admin" | "staff";
  defaultBranchId?: string;
  accessibleBranchIds?: string[];
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
