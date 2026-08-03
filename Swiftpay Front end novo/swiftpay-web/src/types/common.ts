export interface ErrorResponse {
  message: string | null;
  code?: string | null;
}

export interface BaseResponse {
  message: string | null;
  error: ErrorResponse | null;
}

export interface ApiResponse<T> {
  data: T | null;
  message: string | null;
  error: ErrorResponse | null;
}

export interface Paginated<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

