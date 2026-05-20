import { z } from 'zod';
import { PaymentMethod } from '@/types/enums';

export const buyerFieldSchema = z.enum(['Name', 'Email', 'Phone']);
export const paymentMethodSchema = z.enum([PaymentMethod.Pix, PaymentMethod.Boleto, PaymentMethod.CreditCard]);
export const expirationPresetSchema = z.enum(['1d', '2d', '3d', '7d', 'custom']);
export const themeModeSchema = z.enum(['Light', 'Dark', 'Auto']);

export const paymentLinkFormSchema = z.object({
  enabledMethods: z.array(paymentMethodSchema).min(1, 'Selecione ao menos um metodo de pagamento.'),
  billing: z.object({
    amountFormatted: z.string().min(1, 'Informe um valor.'),
    redirectUrl: z.string().trim().optional(),
  }),
  product: z.object({
    name: z.string(),
    description: z.string(),
    imageUrl: z.string(),
  }),
  settings: z.object({
    callbackUrl: z.string().trim().optional(),
    pixExpirationMinutes: z.string(),
    boletoDueDate: z.string(),
    boletoInstructions: z.string(),
    canExpire: z.boolean(),
    expirationPreset: expirationPresetSchema,
    customExpiresAt: z.string(),
    requiredBuyerFields: z.array(buyerFieldSchema),
    showFees: z.boolean(),
    passFeeToCustomer: z.boolean(),
  }),
  visual: z.object({
    themeMode: themeModeSchema,
    logoUrl: z.string(),
  }),
});

export type PaymentLinkFormData = z.infer<typeof paymentLinkFormSchema>;
export type BillingFormState = PaymentLinkFormData['billing'];
export type ProductFormState = PaymentLinkFormData['product'];
export type SettingsFormState = PaymentLinkFormData['settings'];
export type VisualFormState = PaymentLinkFormData['visual'];
export type ExpirationPreset = z.infer<typeof expirationPresetSchema>;
