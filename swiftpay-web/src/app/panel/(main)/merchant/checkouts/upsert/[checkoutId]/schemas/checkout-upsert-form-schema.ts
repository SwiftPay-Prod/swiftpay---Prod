import { z } from 'zod';
import { CheckoutColorMode } from '@/types/enums';

export const checkoutNameFormSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome do checkout e obrigatorio')
    .min(3, 'O nome deve ter pelo menos 3 caracteres'),
});

export type CheckoutNameFormData = z.infer<typeof checkoutNameFormSchema>;

const hexColorRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
const socialProofPositionSchema = z.enum(['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight']);

export const checkoutOnboardingFormSchema = z
  .object({
    name: z.string().default(''),
    templateId: z.string().default(''),

    // Payments
    pixEnabled: z.boolean().default(false),
    pixExpirationMinutes: z.number().int().default(30),
    creditCardEnabled: z.boolean().default(false),
    boletoEnabled: z.boolean().default(false),
    reservationExpirationMinutes: z.number().int().default(15),

    // Customer
    requireCustomerPhone: z.boolean().default(false),
    requireCustomerDocument: z.boolean().default(false),
    requireCustomerAddress: z.boolean().default(false),

    // Features
    couponEnabled: z.boolean().default(false),
    shippingEnabled: z.boolean().default(false),
    fixedShippingAmount: z.number().int().nullable().default(null),
    showTimer: z.boolean().default(false),
    timerMinutes: z.number().int().default(15),
    timerText: z.string().default(''),
    timerExpiredText: z.string().default(''),
    socialProofEnabled: z.boolean().default(false),
    socialProofIntervalSeconds: z.number().int().default(8),
    socialProofDurationSeconds: z.number().int().default(4),
    socialProofPosition: socialProofPositionSchema.default('BottomLeft'),
    socialProofNotifications: z
      .array(
        z.object({
          name: z.string().default(''),
          location: z.string().default(''),
          action: z.string().default(''),
        })
      )
      .default([]),

    // Products
    productsCount: z.number().int().min(0).default(0),

    // URLs
    successUrl: z.string().default(''),
    cancelUrl: z.string().default(''),
    callbackUrl: z.string().default(''),

    // Visual
    primaryColor: z.string().default('#1886ed'),
    secondaryColor: z.string().default(''),
    colorMode: z.nativeEnum(CheckoutColorMode).default(CheckoutColorMode.Single),
    logoUrl: z.string().default(''),
    backgroundImageUrl: z.string().default(''),
    faviconUrl: z.string().default(''),
  })
  .superRefine((value, ctx) => {
    if (!value.templateId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['templateId'],
        message: 'Selecione um template.',
      });
    }

    const hasPaymentMethod = value.pixEnabled || value.creditCardEnabled || value.boletoEnabled;
    if (!hasPaymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pixEnabled'],
        message: 'Ative ao menos um método de pagamento.',
      });
    }

    if (value.pixExpirationMinutes < 1 || value.pixExpirationMinutes > 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pixExpirationMinutes'],
        message: 'Expiração do PIX deve estar entre 1 e 60 minutos.',
      });
    }

    if (value.reservationExpirationMinutes < 1 || value.reservationExpirationMinutes > 60) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reservationExpirationMinutes'],
        message: 'Tempo de reserva deve estar entre 1 e 60 minutos.',
      });
    }

    if (!hexColorRegex.test(value.primaryColor.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryColor'],
        message: 'A cor principal deve estar em formato hexadecimal válido.',
      });
    }

    if (value.colorMode === CheckoutColorMode.Gradient && value.secondaryColor.trim()) {
      if (!hexColorRegex.test(value.secondaryColor.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['secondaryColor'],
          message: 'A cor secundária deve estar em formato hexadecimal válido.',
        });
      }
    }

    if (value.shippingEnabled && value.fixedShippingAmount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fixedShippingAmount'],
        message: 'Defina o valor do frete fixo ao habilitar frete.',
      });
    }

    if (value.showTimer) {
      if (value.timerMinutes < 1 || value.timerMinutes > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timerMinutes'],
          message: 'Timer deve estar entre 1 e 60 minutos.',
        });
      }

      if (!value.timerText.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timerText'],
          message: 'Informe o texto do timer.',
        });
      }

      if (value.timerText.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timerText'],
          message: 'Texto do timer deve ter no máximo 200 caracteres.',
        });
      }

      if (value.timerExpiredText.length > 200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timerExpiredText'],
          message: 'Texto de expiração do timer deve ter no máximo 200 caracteres.',
        });
      }
    }

    if (value.socialProofEnabled) {
      if (value.socialProofIntervalSeconds < 3 || value.socialProofIntervalSeconds > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['socialProofIntervalSeconds'],
          message: 'Intervalo da prova social deve estar entre 3 e 60 segundos.',
        });
      }

      if (value.socialProofDurationSeconds < 1 || value.socialProofDurationSeconds > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['socialProofDurationSeconds'],
          message: 'Duração da prova social deve estar entre 1 e 10 segundos.',
        });
      }

      if (value.socialProofNotifications.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['socialProofNotifications'],
          message: 'Adicione ao menos uma notificação de prova social.',
        });
      }

      const hasInvalidNotification = value.socialProofNotifications.some(
        (notification) =>
          !notification.name.trim() || !notification.location.trim() || !notification.action.trim()
      );

      if (hasInvalidNotification) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['socialProofNotifications'],
          message: 'Preencha nome, localização e ação em todas as notificações de prova social.',
        });
      }
    }

    const urlsToValidate = [
      { key: 'successUrl', value: value.successUrl },
      { key: 'cancelUrl', value: value.cancelUrl },
      { key: 'callbackUrl', value: value.callbackUrl },
    ] as const;

    for (const item of urlsToValidate) {
      const trimmed = item.value.trim();
      if (!trimmed) {
        continue;
      }

      try {
        new URL(trimmed);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [item.key],
          message: 'URL inválida.',
        });
      }
    }
  });

export type CheckoutOnboardingFormData = z.infer<typeof checkoutOnboardingFormSchema>;

type CheckoutReviewValidationInput = Pick<
  CheckoutOnboardingFormData,
  | 'name'
  | 'templateId'
  | 'pixEnabled'
  | 'creditCardEnabled'
  | 'boletoEnabled'
  | 'productsCount'
  | 'successUrl'
  | 'cancelUrl'
  | 'callbackUrl'
  | 'primaryColor'
  | 'secondaryColor'
  | 'colorMode'
>;

export function validateCheckoutOnboardingReview(values: CheckoutReviewValidationInput): string[] {
  const result = checkoutOnboardingFormSchema.safeParse(values);
  if (result.success) {
    return [];
  }

  const messages = result.error.issues.map((issue) => issue.message);
  return [...new Set(messages)];
}
