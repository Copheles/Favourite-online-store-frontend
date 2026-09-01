import { axiosClient } from "@/lib/axios";
import { toQueryString } from "@/lib/queryParams";
import type {
  AddOrderPaymentInput,
  ExchangeOrderInput,
  OrderDetail,
  OrderListItem,
  OrderReceipt,
  OrderStatus,
  PaginatedResponse,
  PaymentType,
} from "@/types/api";

export interface ListOrdersParams {
  branchId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  paymentType?: PaymentType;
  status?: OrderStatus;
  customerId?: string;
  futureOnly?: boolean;
  page?: number;
  limit?: number;
}

export async function listOrders(
  params: ListOrdersParams = {},
): Promise<PaginatedResponse<OrderListItem>> {
  const { data } = await axiosClient.get<PaginatedResponse<OrderListItem>>(
    `/api/orders${toQueryString(params)}`,
  );
  return data;
}

export async function getOrder(id: string): Promise<OrderDetail> {
  const { data } = await axiosClient.get<OrderDetail>(`/api/orders/${id}`);
  return data;
}

export async function getOrderReceipt(id: string): Promise<OrderReceipt> {
  const { data } = await axiosClient.get<OrderReceipt>(
    `/api/orders/${id}/receipt`,
  );
  return data;
}

export async function updateOrderStatus(
  id: string,
  status: Extract<OrderStatus, "COMPLETED" | "CANCELLED">,
): Promise<OrderDetail> {
  const { data } = await axiosClient.patch<OrderDetail>(
    `/api/orders/${id}/status`,
    { status },
  );
  return data;
}

export async function addOrderPayment(
  id: string,
  input: AddOrderPaymentInput,
): Promise<OrderDetail> {
  const { data } = await axiosClient.post<OrderDetail>(
    `/api/orders/${id}/payments`,
    input,
  );
  return data;
}

export async function exchangeOrder(
  id: string,
  input: ExchangeOrderInput,
): Promise<OrderDetail> {
  const { data } = await axiosClient.post<OrderDetail>(
    `/api/orders/${id}/exchange`,
    input,
  );
  return data;
}
