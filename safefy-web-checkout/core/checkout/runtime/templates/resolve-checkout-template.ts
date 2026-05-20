import { checkoutTemplateRegistry } from './registry';
import { normalizeTemplateCode } from './normalize-template-code';
import type { CheckoutTemplateModule } from './types';

const defaultTemplate = checkoutTemplateRegistry[0];

function resolveFromRegistry(normalizedCode: string): CheckoutTemplateModule | null {
  for (const template of checkoutTemplateRegistry) {
    if (normalizeTemplateCode(template.code) === normalizedCode) {
      return template;
    }

    const aliases = template.aliases ?? [];
    if (aliases.some((alias) => normalizeTemplateCode(alias) === normalizedCode)) {
      return template;
    }
  }

  return null;
}

export function resolveCheckoutTemplate(templateCode: string | null | undefined): CheckoutTemplateModule {
  const normalizedCode = normalizeTemplateCode(templateCode);

  if (!normalizedCode) {
    return defaultTemplate;
  }

  return resolveFromRegistry(normalizedCode) ?? defaultTemplate;
}
