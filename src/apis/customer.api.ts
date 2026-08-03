import { axiosClient } from "@/lib/axios";
import { toQueryString } from "@/lib/queryParams";
import type {
  Customer,
  CustomerInput,
  OutstandingItem,
  PaginatedResponse,
} from "@/types/api";

export interface ListCustomersParams {
  branchId?: string;
  search?: string;
  contact?: "WITH_PHONE" | "NO_PHONE";
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface ListOutstandingParams {
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listCustomers(
  params: ListCustomersParams = {},
): Promise<PaginatedResponse<Customer>> {
  const { data } = await axiosClient.get<PaginatedResponse<Customer>>(
    `/api/customers${toQueryString(params)}`,
  );
  return data;
}

export async function listOutstandingCustomers(
  params: ListOutstandingParams = {},
): Promise<PaginatedResponse<OutstandingItem>> {
  const { data } = await axiosClient.get<PaginatedResponse<OutstandingItem>>(
    `/api/customers/outstanding${toQueryString(params)}`,
  );
  return data;
}

export async function getCustomer(
  id: string,
  branchId?: string,
): Promise<Customer> {
  const { data } = await axiosClient.get<Customer>(
    `/api/customers/${id}${toQueryString({ branchId })}`,
  );
  return data;
}

export async function createCustomer(
  input: CustomerInput,
  branchId?: string,
): Promise<Customer> {
  const { data } = await axiosClient.post<Customer>(
    `/api/customers${toQueryString({ branchId })}`,
    input,
  );
  return data;
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
  branchId?: string,
): Promise<Customer> {
  const { data } = await axiosClient.patch<Customer>(
    `/api/customers/${id}${toQueryString({ branchId })}`,
    input,
  );
  return data;
}

export async function deleteCustomer(
  id: string,
  branchId?: string,
): Promise<void> {
  await axiosClient.delete(
    `/api/customers/${id}${toQueryString({ branchId })}`,
  );
}
