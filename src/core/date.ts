import { format, formatDistanceToNowStrict, isWithinInterval, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ISODateTime } from '@/domain/entities';

export function formatDateTime(iso: ISODateTime): string {
  return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });
}

export function formatDate(iso: ISODateTime): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: es });
}

export function formatTime(iso: ISODateTime): string {
  return format(parseISO(iso), 'HH:mm', { locale: es });
}

export function timeAgo(iso: ISODateTime): string {
  return formatDistanceToNowStrict(parseISO(iso), { locale: es, addSuffix: true });
}

export function isWithinWeek(iso: ISODateTime, now: Date = new Date()): boolean {
  return isWithinInterval(parseISO(iso), {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: now,
  });
}

export function isWithinMonth(iso: ISODateTime, now: Date = new Date()): boolean {
  return isWithinInterval(parseISO(iso), { start: startOfMonth(now), end: now });
}
