export function safeToISOString(date: any): string {
  if (!date) return '';
  if (typeof date === 'string') {
    if (!isNaN(Date.parse(date))) return new Date(date).toISOString();
    return '';
  }
  if (typeof date.toDate === 'function') {
    try {
      return date.toDate().toISOString();
    } catch {
      return '';
    }
  }
  if (date instanceof Date) {
    return date.toISOString();
  }
  return '';
} 