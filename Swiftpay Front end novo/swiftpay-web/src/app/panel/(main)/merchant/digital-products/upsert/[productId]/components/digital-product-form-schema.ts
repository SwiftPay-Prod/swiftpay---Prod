import { z } from 'zod';
import { ProductStatus, ProductType, VariantStatus, DigitalItemType } from '@/types/enums';

export const pendingVariantSchema = z.object({
  tempId: z.string(),
  name: z.string().min(1, 'Nome da variante e obrigatorio'),
  price: z.number().min(0, 'Preco deve ser maior ou igual a zero'),
  externalId: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  stockQuantity: z.number().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  status: z.enum(VariantStatus).optional(),
});

export const pendingDigitalItemSchema = z.object({
  tempId: z.string(),
  type: z.enum(DigitalItemType),
  content: z.string().min(1, 'Conteudo e obrigatorio'),
  variantId: z.string().optional().nullable(),
});

export const digitalProductFormSchema = z.object({
  type: z.literal(ProductType.Digital),
  name: z.string().min(1, 'Nome do produto e obrigatorio'),
  description: z.string().optional().nullable(),
  externalId: z.string().optional().nullable(),
  status: z.enum(ProductStatus).nullable(),
  price: z.number().optional().nullable(),
  imageUrls: z.array(z.string()),
  categoryIds: z.array(z.string()),
  couponIds: z.array(z.string()),
  pendingVariants: z.array(pendingVariantSchema),
  isUnlimitedDigitalStock: z.boolean(),
  pendingDigitalItems: z.array(pendingDigitalItemSchema),
});

export type PendingVariantFormData = z.infer<typeof pendingVariantSchema>;
export type PendingDigitalItemFormData = z.infer<typeof pendingDigitalItemSchema>;
export type DigitalProductFormData = z.infer<typeof digitalProductFormSchema>;
