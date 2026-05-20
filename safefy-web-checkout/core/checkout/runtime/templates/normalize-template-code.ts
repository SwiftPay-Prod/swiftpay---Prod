export function normalizeTemplateCode(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.trim().toLowerCase().replace(/[-_\s]/g, '');
}
