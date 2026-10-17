import { format, isSameYear, isToday, isYesterday } from "date-fns";
import { formatWhen } from "@/lib/dates";
import type { Discussion } from "@/lib/types";

function dayLabel(date: Date, now: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, isSameYear(date, now) ? "EEEE, d MMM" : "d MMM yyyy");
}

/** Groups already-sorted (newest first) discussions under day headings. */
function groupByDay(discussions: Discussion[], now: Date) {
  const groups: { label: string; items: Discussion[] }[] = [];
  for (const discussion of discussions) {
    const label = dayLabel(new Date(discussion.created_at), now);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(discussion);
    else groups.push({ label, items: [discussion] });
  }
  return groups;
}

interface DiscussionTimelineProps {
  discussions: Discussion[] | undefined;
  isLoading: boolean;
  error: Error | null;
  now: Date;
}

export function DiscussionTimeline({ discussions, isLoading, error, now }: DiscussionTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 py-2" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-sm bg-hover" />
            <div className="h-3.5 w-4/5 animate-pulse rounded-sm bg-hover" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="py-6 text-center text-[13px] text-danger">Couldn&apos;t load discussions: {error.message}</p>;
  }

  if (!discussions?.length) {
    return (
      <div className="py-10 text-center">
        <p className="text-[13px] font-medium">No discussions yet</p>
        <p className="mt-0.5 text-[13px] text-muted">Log your first conversation with this lead below.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groupByDay(discussions, now).map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 text-xs font-semibold text-muted">{group.label}</h3>
          <ol className="space-y-0">
            {group.items.map((discussion) => (
              <li key={discussion.id} className="group relative pb-4 pl-5 last:pb-0">
                <span aria-hidden="true" className="absolute top-[7px] left-[3px] size-[7px] rounded-full border-[1.5px] border-accent bg-surface" />
                <span aria-hidden="true" className="absolute top-4 bottom-0 left-[6px] w-px bg-line group-last:hidden" />
                <time dateTime={discussion.created_at} className="font-mono text-[11px] text-muted">
                  {format(new Date(discussion.created_at), "h:mm a")}
                </time>
                <p className="mt-0.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink">{discussion.note}</p>
                {discussion.follow_up_at && (
                  <p className="mt-1 text-xs text-muted">
                    Follow-up set for <span className="text-ink-soft">{formatWhen(discussion.follow_up_at, now)}</span>
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
