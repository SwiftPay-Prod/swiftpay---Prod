import { z } from 'zod';

export const orderItemFormSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable(),
  productName: z.string().min(1),
  variantName: z.string().nullable(),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  imageUrl: z.string().nullable(),
});

export const orderUpsertFormSchema = z.object({
  customerId: z.string().nullable(),
  items: z.array(orderItemFormSchema),
  couponCode: z.string(),
  shippingAmountFormatted: z.string(),
  notes: z.string(),
});

export type OrderItemFormData = z.infer<typeof orderItemFormSchema>;
export type OrderUpsertFormData = z.infer<typeof orderUpsertFormSchema>;
