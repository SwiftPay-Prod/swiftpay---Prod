export function normalizeCheckoutHexColor(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  let normalized = value.trim();
  if (!normalized.startsWith('#')) normalized = `#${normalized}`;

  if (/^#[0-9A-Fa-f]{3}$/.test(normalized)) {
    const [red, green, blue] = normalized.slice(1);
    return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
  }

  if (/^#[0-9A-Fa-f]{6}$/.test(normalized)) return normalized.toUpperCase();
  if (/^#[0-9A-Fa-f]{8}$/.test(normalized)) return normalized.slice(0, 7).toUpperCase();

  return undefined;
}
