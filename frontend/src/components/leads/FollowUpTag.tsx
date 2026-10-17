import clsx from "clsx";
import { followUpState, formatWhen, overdueLabel } from "@/lib/dates";

export function FollowUpTag({ at, now }: { at: string | null; now: Date }) {
  if (!at) return <span className="text-faint">—</span>;

  const state = followUpState(at, now);
  const label = state === "overdue" ? overdueLabel(at, now) : formatWhen(at, now);

  return (
    <span
      title={new Date(at).toLocaleString()}
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        (state === "overdue" || state === "late-today") && "font-medium text-danger",
        state === "today" && "font-medium text-accent",
        state === "upcoming" && "text-ink-soft",
      )}
    >
      <ClockIcon />
      {label}
    </span>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
      <circle cx="6" cy="6" r="4.9" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3.4V6l1.7 1.1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
