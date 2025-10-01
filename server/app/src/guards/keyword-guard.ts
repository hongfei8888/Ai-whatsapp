import { appConfig } from '../config';
import { ForbiddenKeywordError } from '../errors';

export function ensureNoForbiddenKeyword(content: string): void {
  const normalized = content.toLowerCase();
  const match = appConfig.bannedKeywords.find((keyword) => keyword.length > 0 && normalized.includes(keyword));

  if (match) {
    throw new ForbiddenKeywordError(`Message contains forbidden keyword: ${match}`);
  }
}

export function containsForbiddenKeyword(content: string): string | null {
  const normalized = content.toLowerCase();
  const match = appConfig.bannedKeywords.find((keyword) => keyword.length > 0 && normalized.includes(keyword));
  return match ?? null;
}
