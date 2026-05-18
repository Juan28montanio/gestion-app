import {
  adjustCustomerTicketWallet,
  createCustomer,
  deleteCustomer,
  listCustomers,
  subscribeToCustomers as subscribeToSupabaseCustomers,
  updateCustomer,
} from "../supabase/customerService";
import { normalizeCustomers } from "../../domain/customers";

export async function getCustomers(businessId) {
  return normalizeCustomers(await listCustomers(businessId));
}

export function subscribeToAppCustomers(businessId, callback) {
  return subscribeToSupabaseCustomers(businessId, (customers) => callback(normalizeCustomers(customers)));
}

export {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  adjustCustomerTicketWallet,
};
