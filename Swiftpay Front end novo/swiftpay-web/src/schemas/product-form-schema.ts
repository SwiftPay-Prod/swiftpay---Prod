import { z } from 'zod';
import { ProductStatus, ProductType, VariantStatus, DigitalItemType } from '@/types/enums';

export const pendingVariantSchema = z.object({
	tempId: z.string(),
	name: z.string().min(1, 'Nome da variante é obrigatório'),
	price: z.number().min(0, 'Preço deve ser maior ou igual a zero'),
	externalId: z.string().optional().nullable(),
	sku: z.string().optional().nullable(),
	stockQuantity: z.number().optional().nullable(),
	imageUrl: z.string().optional().nullable(),
	status: z.nativeEnum(VariantStatus).optional(),
});

export const pendingDigitalItemSchema = z.object({
	tempId: z.string(),
	type: z.nativeEnum(DigitalItemType),
	content: z.string().min(1, 'Conteúdo é obrigatório'),
	variantId: z.string().optional().nullable(),
});

export const baseProductFormSchema = z.object({
	name: z.string().min(1, 'Nome do produto é obrigatório'),
	description: z.string().optional().nullable(),
	externalId: z.string().optional().nullable(),
	status: z.nativeEnum(ProductStatus).nullable(),
	price: z.number().optional().nullable(),
	imageUrls: z.array(z.string()),
	categoryIds: z.array(z.string()),
	couponIds: z.array(z.string()),
	pendingVariants: z.array(pendingVariantSchema),
});

export const digitalProductFormSchema = baseProductFormSchema.extend({
	type: z.literal(ProductType.Digital),
	isUnlimitedDigitalStock: z.boolean(),
	pendingDigitalItems: z.array(pendingDigitalItemSchema),
});

export const physicalProductFormSchema = baseProductFormSchema.extend({
	type: z.literal(ProductType.Physical),
	stockQuantity: z.number().optional().nullable(),
	isUnlimitedStock: z.boolean(),
});

export const serviceProductFormSchema = baseProductFormSchema.extend({
	type: z.literal(ProductType.Service),
});

export type PendingVariantFormData = z.infer<typeof pendingVariantSchema>;
export type PendingDigitalItemFormData = z.infer<typeof pendingDigitalItemSchema>;
export type BaseProductFormData = z.infer<typeof baseProductFormSchema>;
export type DigitalProductFormData = z.infer<typeof digitalProductFormSchema>;
export type PhysicalProductFormData = z.infer<typeof physicalProductFormSchema>;
export type ServiceProductFormData = z.infer<typeof serviceProductFormSchema>;

