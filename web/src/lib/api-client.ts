import { AuthResponse, User, PaymentLink, Balance, Transaction, Withdrawal, PagedResponse } from './types';

const GESTAO_API = process.env.NEXT_PUBLIC_GESTAO_API_URL || 'http://localhost:5001/api/v1';
const PAYMENT_API = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://localhost:5002/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('swiftpay_token');
}

async function request<T>(base: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { ...options, headers });

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
    request<ApiResponse<AuthResponse>>(GESTAO_API, '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { name: string; email: string; password: string; companyName: string; document: string }) =>
    request<ApiResponse<AuthResponse>>(GESTAO_API, '/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<ApiResponse<User>>(GESTAO_API, '/auth/me'),
};

export const paymentLinks = {
  create: (data: Partial<PaymentLink>) =>
    request<ApiResponse<string>>(PAYMENT_API, '/payment-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: (page = 1, limit = 25) =>
    request<ListResponse<PaymentLink>>(PAYMENT_API, `/payment-links?page=${page}&limit=${limit}`),
  getById: (id: string) =>
    request<ApiResponse<PaymentLink>>(PAYMENT_API, `/payment-links/${id}`),
};

export const wallet = {
  balance: () =>
    request<ApiResponse<Balance>>(PAYMENT_API, '/wallet/balance'),
  transactions: (page = 1, limit = 25) =>
    request<ListResponse<Transaction>>(PAYMENT_API, `/wallet/transactions?page=${page}&limit=${limit}`),
};

export const withdrawals = {
  request: (amount: number, pixKey: string, pixKeyType: string) =>
    request<ApiResponse<string>>(PAYMENT_API, '/wallet/withdrawals', {
      method: 'POST',
      body: JSON.stringify({ amount, pixKey, pixKeyType }),
    }),
  list: (page = 1, limit = 25) =>
    request<ListResponse<Withdrawal>>(PAYMENT_API, `/wallet/withdrawals?page=${page}&limit=${limit}`),
};

export { ApiError };
