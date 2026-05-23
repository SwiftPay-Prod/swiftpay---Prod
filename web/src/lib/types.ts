export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PaymentLink {
  id: string;
  title: string;
  description?: string;
  amount: number;
  amountMin?: number;
  amountMax?: number;
  slug: string;
  isActive: boolean;
  isExpired: boolean;
  isExhausted: boolean;
  expiresAt?: string;
  maxUses?: number;
  usesCount: number;
  createdAt: string;
}

export interface Balance {
  available: number;
  pending: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  method: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
