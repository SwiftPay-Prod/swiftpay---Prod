import { CheckoutTemplateType, FeeChargeMode } from "../enums";
import type { PaginationParams } from "../common";

// ========== Admin Template Data (for CRUD operations) ==========

export interface AdminTemplateData {
  id: string;
  code: string;
  type: CheckoutTemplateType;
  name: string;
  shortDescription: string | null;
  fullDescription: string | null;
  bestFor: string | null;
  thumbnailUrl: string | null;
  previewImages: string[];
  features: string[];
  /** Modo de cobrança de taxa (null = template gratuito) */
  feeMode: FeeChargeMode | null;
  /** Taxa fixa em centavos (ex: 100 = R$ 1,00) */
  feeFixed: number;
  /** Taxa percentual em basis points (ex: 150 = 1.5%) */
  feePercentage: number;
  isActive: boolean;
  usageCount: number;
  activeCheckouts: number;
  supportsCoupons: boolean;
  supportsShipping: boolean;
  supportsTimer: boolean;
  supportsSocialProof: boolean;
  supportsClarity: boolean;
  supportsFacebookPixel: boolean;
  supportsGoogleTagManager: boolean;
  supportsTikTok: boolean;
  supportsKwai: boolean;
  supportsPinterest: boolean;
  supportsTaboola: boolean;
  supportsUtmify: boolean;
  supportsOtimizey: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== Admin Template Minimal (for listings) ==========

export interface AdminMinimalTemplate {
  id: string;
  code: string;
  type: CheckoutTemplateType;
  name: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  /** Modo de cobrança de taxa (null = template gratuito) */
  feeMode: FeeChargeMode | null;
  /** Taxa fixa em centavos */
  feeFixed: number;
  /** Taxa percentual em basis points */
  feePercentage: number;
  isActive: boolean;
  usageCount: number;
  activeCheckouts: number;
  supportsCoupons: boolean;
  supportsShipping: boolean;
  supportsTimer: boolean;
  supportsSocialProof: boolean;
  supportsClarity: boolean;
  supportsFacebookPixel: boolean;
  supportsGoogleTagManager: boolean;
  supportsTikTok: boolean;
  supportsKwai: boolean;
  supportsPinterest: boolean;
  supportsTaboola: boolean;
  supportsUtmify: boolean;
  supportsOtimizey: boolean;
  createdAt: string;
}

// ========== Requests ==========

export interface AdminReadListTemplatesRequest extends PaginationParams {
  isActive?: boolean | null;
  /** Filtra por gratuitos (true) ou pagos (false) */
  isFree?: boolean | null;
  type?: CheckoutTemplateType | null;
  search?: string | null;
}

export interface AdminCreateTemplateRequest {
  code: string;
  type: CheckoutTemplateType;
  name: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  bestFor?: string | null;
  thumbnailUrl?: string | null;
  previewImages?: string[] | null;
  features?: string[] | null;
  /** Modo de cobrança (null = gratuito) */
  feeMode?: FeeChargeMode | null;
  /** Taxa fixa em centavos */
  feeFixed?: number;
  /** Taxa percentual em basis points */
  feePercentage?: number;
  isActive?: boolean;
  supportsCoupons?: boolean;
  supportsShipping?: boolean;
  supportsTimer?: boolean;
  supportsSocialProof?: boolean;
  supportsClarity?: boolean;
  supportsFacebookPixel?: boolean;
  supportsGoogleTagManager?: boolean;
  supportsTikTok?: boolean;
  supportsKwai?: boolean;
  supportsPinterest?: boolean;
  supportsTaboola?: boolean;
  supportsUtmify?: boolean;
  supportsOtimizey?: boolean;
}

export interface AdminUpdateTemplateRequest {
  code?: string | null;
  type?: CheckoutTemplateType | null;
  name?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  bestFor?: string | null;
  thumbnailUrl?: string | null;
  previewImages?: string[] | null;
  features?: string[] | null;
  /** Modo de cobrança (null = gratuito, use removeFee para limpar) */
  feeMode?: FeeChargeMode | null;
  /** Taxa fixa em centavos */
  feeFixed?: number | null;
  /** Taxa percentual em basis points */
  feePercentage?: number | null;
  /** Define como true para tornar o template gratuito */
  removeFee?: boolean;
  isActive?: boolean | null;
  supportsCoupons?: boolean | null;
  supportsShipping?: boolean | null;
  supportsTimer?: boolean | null;
  supportsSocialProof?: boolean | null;
  supportsClarity?: boolean | null;
  supportsFacebookPixel?: boolean | null;
  supportsGoogleTagManager?: boolean | null;
  supportsTikTok?: boolean | null;
  supportsKwai?: boolean | null;
  supportsPinterest?: boolean | null;
  supportsTaboola?: boolean | null;
  supportsUtmify?: boolean | null;
  supportsOtimizey?: boolean | null;
}

