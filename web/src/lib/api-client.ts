import { AuthResponse, User, PaymentLink, Balance, Transaction, PagedResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('swiftpay_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, error.message || 'Request failed');
  }

  return res.json();
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ListResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const auth = {
  login: (email: string, password: string) =>
    request<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; companyName: string; document: string }) =>
    request<ApiResponse<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<ApiResponse<User>>('/auth/me'),
};

export const paymentLinks = {
  create: (data: Partial<PaymentLink>) =>
    request<ApiResponse<string>>('/payment-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (page = 1, limit = 25) =>
    request<ListResponse<PaymentLink>>(`/payment-links?page=${page}&limit=${limit}`),
  getById: (id: string) =>
    request<ApiResponse<PaymentLink>>(`/payment-links/${id}`),
};

export const wallet = {
  balance: () =>
    request<ApiResponse<Balance>>('/wallet/balance'),
  transactions: (page = 1, limit = 25) =>
    request<ListResponse<Transaction>>(`/wallet/transactions?page=${page}&limit=${limit}`),
};

export { ApiError };
