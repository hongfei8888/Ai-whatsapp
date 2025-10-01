export function chatIdToE164(chatId: string): string {
  const [raw] = chatId.split('@');
  const digits = raw.replace(/[^\d]/g, '');
  return `+${digits}`;
}

export function normalizeE164(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `+${digits}`;
}
