import { z } from 'zod';
import { CustomerDocumentType, CustomerStatus } from '@/types/enums';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .nullable();

export const customerAddressSchema = z.object({
  postalCode: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
});

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome e obrigatorio'),
  email: z
    .string()
    .trim()
    .min(1, 'E-mail e obrigatorio')
    .refine((value: string) => emailRegex.test(value), 'E-mail invalido'),
  externalId: optionalTrimmedString,
  documentType: z.enum(CustomerDocumentType).optional().nullable(),
  document: optionalTrimmedString,
  phone: optionalTrimmedString,
  metadata: optionalTrimmedString,
  status: z.enum(CustomerStatus).optional().nullable(),
  address: customerAddressSchema,
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
