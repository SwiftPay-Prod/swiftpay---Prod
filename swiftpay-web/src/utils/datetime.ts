export function formatDate(dateString: string | null, includeTime = true): string {
  if (!dateString) return '-';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Date(dateString).toLocaleDateString('pt-BR', options);
}

export function formatDateTime(dateString: string | null): string {
  return formatDate(dateString, true);
}

export function formatDateOnly(dateString: string | null): string {
  return formatDate(dateString, false);
}

export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  const months = Math.floor(days / 30);
  return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

/**
 * Formata tempo relativo a partir de um objeto Date
 * @deprecated Use formatRelativeTime com string ISO
 */
export function formatTimeAgo(date: Date): string {
  return formatRelativeTime(date.toISOString());
}

