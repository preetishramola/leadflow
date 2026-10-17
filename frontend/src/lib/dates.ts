import {
  addDays,
  addHours,
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  nextMonday,
  setHours,
  startOfDay,
  startOfHour,
} from "date-fns";
import type { Lead } from "./types";

/** "just now", "12m ago", "3h ago", "4d ago". */
export function timeAgo(iso: string, now: Date): string {
  const date = new Date(iso);
  const seconds = (now.getTime() - date.getTime()) / 1000;
  if (seconds < 60) return "just now";
  const [value, unit] = formatDistanceStrict(date, now, { roundingMethod: "floor" }).split(" ");
  const short: Record<string, string> = { second: "s", minute: "m", hour: "h", day: "d", month: "mo", year: "y" };
  return `${value}${short[unit.replace(/s$/, "")] ?? unit} ago`;
}

/** Short, human date+time: "Today 4:30 PM", "Tomorrow 10:00 AM", "Mon 21 Oct, 9:00 AM". */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const time = format(date, "h:mm a");
  if (isToday(date)) return `Today ${time}`;
  if (isTomorrow(date)) return `Tomorrow ${time}`;
  if (isYesterday(date)) return `Yesterday ${time}`;
  return format(date, isSameYear(date, now) ? "EEE d MMM, h:mm a" : "d MMM yyyy, h:mm a");
}

export type FollowUpState = "overdue" | "late-today" | "today" | "upcoming";

export function followUpState(iso: string, now: Date): FollowUpState {
  const date = new Date(iso);
  if (date < startOfDay(now)) return "overdue";
  if (isToday(date)) return date < now ? "late-today" : "today";
  return "upcoming";
}

export function overdueLabel(iso: string, now: Date): string {
  const days = differenceInCalendarDays(now, new Date(iso));
  return days === 1 ? "1 day overdue" : `${days} days overdue`;
}

export interface LeadSections {
  overdue: Lead[];
  today: Lead[];
  rest: Lead[];
}

/**
 * Splits leads into pinned groups using the viewer's local calendar day.
 * Done on the client because "today" depends on the user's timezone.
 */
export function sectionLeads(leads: Lead[], now: Date): LeadSections {
  const sections: LeadSections = { overdue: [], today: [], rest: [] };
  for (const lead of leads) {
    const state = lead.follow_up_at ? followUpState(lead.follow_up_at, now) : null;
    if (state === "overdue") sections.overdue.push(lead);
    else if (state === "today" || state === "late-today") sections.today.push(lead);
    else sections.rest.push(lead);
  }
  const byFollowUp = (a: Lead, b: Lead) => a.follow_up_at!.localeCompare(b.follow_up_at!);
  sections.overdue.sort(byFollowUp);
  sections.today.sort(byFollowUp);
  return sections;
}

/** `<input type="datetime-local">` value <-> ISO string with timezone. */
export function toLocalInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export interface QuickPick {
  label: string;
  date: Date;
}

/** Preset follow-up times offered next to the date picker. */
export function followUpPresets(now: Date): QuickPick[] {
  const atTen = (day: Date) => setHours(startOfDay(day), 10);
  const inTwoHours = addHours(startOfHour(now), 3);
  const picks: QuickPick[] = [
    { label: "Tomorrow 10am", date: atTen(addDays(now, 1)) },
    { label: "In 3 days", date: atTen(addDays(now, 3)) },
    { label: "Next Monday", date: atTen(nextMonday(now)) },
  ];
  // Only offer "later today" while there's still a meaningful chunk of the day left.
  if (isToday(inTwoHours)) picks.unshift({ label: "Later today", date: inTwoHours });
  // On Sundays "Next Monday" is tomorrow; keep only the first preset for any given time.
  return picks.filter((pick, i) => picks.findIndex((other) => other.date.getTime() === pick.date.getTime()) === i);
}
