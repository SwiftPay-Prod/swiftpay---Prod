export interface AcquirerDisplayInfo {
  displayName: string;
  nominal: string | null;
}

export function getAcquirerDisplayTitle(info: AcquirerDisplayInfo): string {
  return info.displayName.trim();
}

export function getAcquirerDisplaySubtitle(info: AcquirerDisplayInfo): string {
  const nominal = info.nominal?.trim() ?? '';
  if (nominal) return nominal;
  return 'Sem nominal';
}

export function getAcquirerFullDisplayLabel(info: AcquirerDisplayInfo): string {
  const title = getAcquirerDisplayTitle(info);
  const subtitle = getAcquirerDisplaySubtitle(info);
  if (subtitle === 'Sem nominal') return title;
  return `${title} - ${subtitle}`;
}
