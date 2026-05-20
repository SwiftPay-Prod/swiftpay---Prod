import { CustomerDocumentType, CustomerStatus, PaymentEnvironment } from "../enums";

export interface CustomerAddressData {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface MinimalCustomer {
  id: string;
  externalId: string | null;
  name: string;
  email: string;
  document: string | null;
  documentType: CustomerDocumentType | null;
  phone: string | null;
  status: CustomerStatus;
  address: CustomerAddressData | null;
  paymentsCount: number;
  createdAt: string;
}

export interface CustomerData {
  id: string;
  externalId: string | null;
  name: string;
  email: string;
  document: string | null;
  documentType: CustomerDocumentType | null;
  phone: string | null;
  status: CustomerStatus;
  metadata: string | null;
  address: CustomerAddressData | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReadListCustomersRequest {
  merchantId: string;
  search?: string;
  status?: CustomerStatus;
  environment?: PaymentEnvironment;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomersFilters {
  search?: string;
  status?: CustomerStatus;
  environment?: PaymentEnvironment;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCustomerRequest {
  merchantId: string;
  externalId?: string;
  name: string;
  email: string;
  document?: string;
  documentType?: CustomerDocumentType;
  phone?: string;
  metadata?: string;
  environment?: PaymentEnvironment;
  // Address fields
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
}

export interface UpdateCustomerRequest {
  merchantId: string;
  customerId: string;
  externalId?: string;
  name?: string;
  email?: string;
  document?: string;
  documentType?: CustomerDocumentType;
  phone?: string;
  status?: CustomerStatus;
  metadata?: string;
  environment?: PaymentEnvironment;
  // Address fields
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressPostalCode?: string;
  addressCountry?: string;
}




