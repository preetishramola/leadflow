import clsx from "clsx";
import { followUpState, timeAgo } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { FollowUpTag } from "./FollowUpTag";
import { StatusBadge } from "./StatusBadge";

export const ROW_GRID =
  "md:grid md:grid-cols-[minmax(0,1.25fr)_118px_minmax(0,2.2fr)_84px_158px] md:items-center md:gap-4";

interface LeadRowProps {
  lead: Lead;
  now: Date;
  onOpen: (id: number) => void;
}

export function LeadRow({ lead, now, onOpen }: LeadRowProps) {
  const state = lead.follow_up_at ? followUpState(lead.follow_up_at, now) : null;
  const isLate = state === "overdue" || state === "late-today";

  return (
    <button
      type="button"
      onClick={() => onOpen(lead.id)}
      className={clsx(
        "relative block w-full border-b border-line px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none md:py-2.5",
        ROW_GRID,
        isLate && "bg-danger-soft/50 hover:bg-danger-soft",
      )}
    >
      {isLate && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-danger" />}

      <div className="flex items-start justify-between gap-3 md:block md:min-w-0">
        <div className="min-w-0">
          <div className="truncate font-medium">{lead.name}</div>
          <div className="truncate text-[13px] text-muted">{lead.company ?? "No company"}</div>
        </div>
        <div className="md:hidden">
          <StatusBadge status={lead.status} />
        </div>
      </div>

      <div className="hidden md:block">
        <StatusBadge status={lead.status} />
      </div>

      <p className={clsx("mt-1.5 line-clamp-2 text-[13px] md:mt-0 md:truncate", lead.last_note ? "text-ink-soft" : "text-faint italic")}>
        {lead.last_note ?? "No discussions logged yet"}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs md:contents">
        <span className="font-mono text-muted md:text-right" title={lead.last_discussion_at ? new Date(lead.last_discussion_at).toLocaleString() : undefined}>
          {lead.last_discussion_at ? timeAgo(lead.last_discussion_at, now) : "—"}
        </span>
        <span className="text-[13px]">
          <FollowUpTag at={lead.follow_up_at} now={now} />
        </span>
      </div>
    </button>
  );
}
