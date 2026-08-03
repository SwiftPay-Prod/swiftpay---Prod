import { HeroProTemplate } from './index';
import type { CheckoutTemplateModule } from '@/core/checkout/runtime/templates/types';

export const heroProTemplateModule: CheckoutTemplateModule = {
  code: 'hero-pro',
  aliases: ['heropro'],
  render: ({ checkout, isSandbox, initialCalculation }) => <HeroProTemplate checkout={checkout} isSandbox={isSandbox} initialCalculation={initialCalculation} />,
};
