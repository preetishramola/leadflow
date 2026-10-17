import clsx from "clsx";
import { sectionLeads } from "@/lib/dates";
import type { Lead } from "@/lib/types";
import { LeadRow, ROW_GRID } from "./LeadRow";

interface LeadListProps {
  leads: Lead[];
  now: Date;
  isFiltered: boolean;
  onOpen: (id: number) => void;
  onAddLead: () => void;
}

export function LeadList({ leads, now, isFiltered, onOpen, onAddLead }: LeadListProps) {
  if (leads.length === 0) {
    return isFiltered ? (
      <EmptyState title="No leads match" body="Try a different status or clear the search." />
    ) : (
      <EmptyState
        title="No leads yet"
        body="Add the first person you're talking to and start logging conversations."
        action={
          <button type="button" onClick={onAddLead} className="font-medium text-accent underline-offset-2 hover:underline">
            Add a lead
          </button>
        }
      />
    );
  }

  const { overdue, today, rest } = sectionLeads(leads, now);
  const hasPinned = overdue.length > 0 || today.length > 0;

  return (
    <div>
      <div className={clsx("hidden border-b border-line px-4 py-2 text-xs text-muted", ROW_GRID)}>
        <span>Lead</span>
        <span>Status</span>
        <span>Last discussion</span>
        <span className="text-right">Activity</span>
        <span>Follow-up</span>
      </div>

      <Section title="Overdue" count={overdue.length} tone="danger" leads={overdue} now={now} onOpen={onOpen} />
      <Section title="Due today" count={today.length} tone="accent" leads={today} now={now} onOpen={onOpen} />
      <Section
        title={hasPinned ? "Everything else" : null}
        count={rest.length}
        leads={rest}
        now={now}
        onOpen={onOpen}
      />
    </div>
  );
}

interface SectionProps {
  title: string | null;
  count: number;
  tone?: "danger" | "accent";
  leads: Lead[];
  now: Date;
  onOpen: (id: number) => void;
}

function Section({ title, count, tone, leads, now, onOpen }: SectionProps) {
  if (leads.length === 0) return null;
  return (
    <section aria-label={title ?? "Leads"}>
      {title && (
        <h2 className="flex items-center gap-2 border-b border-line bg-paper/60 px-4 py-1.5 text-xs font-semibold text-ink-soft">
          {tone && <span className={clsx("size-1.5 rounded-full", tone === "danger" ? "bg-danger" : "bg-accent")} />}
          {title}
          <span className="font-mono font-normal text-muted">{count}</span>
        </h2>
      )}
      {leads.map((lead) => (
        <LeadRow key={lead.id} lead={lead} now={now} onOpen={onOpen} />
      ))}
    </section>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-[13px] text-muted">{body}</p>
      {action && <div className="mt-3 text-[13px]">{action}</div>}
    </div>
  );
}
