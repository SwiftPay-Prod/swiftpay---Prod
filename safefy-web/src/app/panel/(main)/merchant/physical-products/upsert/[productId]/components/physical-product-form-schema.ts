import { z } from 'zod';
import { ProductStatus, ProductType, VariantStatus } from '@/types/enums';

const variantStatusSchema = z.enum([
  VariantStatus.Active,
  VariantStatus.Inactive,
  VariantStatus.OutOfStock,
]);

const productStatusSchema = z.enum([
  ProductStatus.Active,
  ProductStatus.Inactive,
  ProductStatus.Archived,
]);

export const pendingVariantSchema = z.object({
  tempId: z.string(),
  name: z.string().min(1, 'Nome da variante é obrigatório'),
  price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
  externalId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  stockQuantity: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  status: variantStatusSchema.optional(),
});

export const physicalProductFormSchema = z.object({
  type: z.literal(ProductType.Physical),
  name: z.string().min(1, 'Nome do produto é obrigatório'),
  description: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  status: productStatusSchema.nullable(),
  price: z.number().optional().nullable(),
  imageUrls: z.array(z.string()),
  categoryIds: z.array(z.string()),
  couponIds: z.array(z.string()),
  pendingVariants: z.array(pendingVariantSchema),
  stockQuantity: z.number().optional().nullable(),
  isUnlimitedStock: z.boolean(),
});

export type PendingVariantFormData = z.infer<typeof pendingVariantSchema>;
export type PhysicalProductFormData = z.infer<typeof physicalProductFormSchema>;
