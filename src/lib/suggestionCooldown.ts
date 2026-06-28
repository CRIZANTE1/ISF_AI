import type { SuggestionType } from '../types/engagementNotifications';

const COOLDOWNS_KEY = 'isfia_suggestion_cooldowns';
const DAILY_KEY = 'isfia_last_suggestion_day';

const TYPE_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const EQUIPMENT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function readCooldowns(): Record<string, string> {
  try {
    const raw = localStorage.getItem(COOLDOWNS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCooldowns(map: Record<string, string>): void {
  try {
    localStorage.setItem(COOLDOWNS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function cooldownKey(type: SuggestionType, extra?: string): string {
  return extra ? `${type}:${extra}` : type;
}

function isWithinCooldown(sentAtIso: string, ms: number): boolean {
  const sentAt = new Date(sentAtIso).getTime();
  return Date.now() - sentAt < ms;
}

export function isWithinAllowedHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 9 && hour < 18;
}

export function wasSuggestionSentToday(): boolean {
  try {
    const lastDay = localStorage.getItem(DAILY_KEY);
    if (!lastDay) return false;
    const today = new Date().toISOString().slice(0, 10);
    return lastDay === today;
  } catch {
    return false;
  }
}

export function canSendSuggestion(type: SuggestionType, extraKey?: string): boolean {
  if (!isWithinAllowedHours()) return false;
  if (wasSuggestionSentToday()) return false;

  const map = readCooldowns();
  const key = cooldownKey(type, extraKey);
  const sentAt = map[key];
  if (!sentAt) return true;

  const ms = extraKey ? EQUIPMENT_COOLDOWN_MS : TYPE_COOLDOWN_MS;
  return !isWithinCooldown(sentAt, ms);
}

export function recordSuggestionSent(type: SuggestionType, extraKey?: string): void {
  const map = readCooldowns();
  const key = cooldownKey(type, extraKey);
  map[key] = new Date().toISOString();
  writeCooldowns(map);

  try {
    localStorage.setItem(DAILY_KEY, new Date().toISOString().slice(0, 10));
  } catch {
    /* ignore */
  }
}
