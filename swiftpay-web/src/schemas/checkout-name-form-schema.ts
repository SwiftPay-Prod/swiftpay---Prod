import { z } from 'zod';

export const checkoutNameFormSchema = z.object({
	name: z
		.string()
		.min(1, 'O nome do checkout e obrigatorio')
		.min(3, 'O nome deve ter pelo menos 3 caracteres'),
});

export type CheckoutNameFormData = z.infer<typeof checkoutNameFormSchema>;
