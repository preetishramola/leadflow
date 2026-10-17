import clsx from "clsx";
import { STATUS_STYLES } from "@/lib/status";
import { LEAD_STATUSES, type LeadStatus, type StatusCounts } from "@/lib/types";
import { StatusDot } from "./StatusBadge";

interface StatusFilterProps {
  value: LeadStatus | null;
  counts: StatusCounts | undefined;
  onChange: (status: LeadStatus | null) => void;
}

export function StatusFilter({ value, counts, onChange }: StatusFilterProps) {
  const options: { value: LeadStatus | null; label: string; count?: number }[] = [
    { value: null, label: "All", count: counts?.total },
    ...LEAD_STATUSES.map((status) => ({
      value: status,
      label: STATUS_STYLES[status].label,
      count: counts?.by_status[status],
    })),
  ];

  return (
    <div role="radiogroup" aria-label="Filter by status" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={clsx(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[13px] transition-colors",
              selected
                ? "border-ink bg-ink text-white"
                : "border-transparent text-ink-soft hover:border-line-strong hover:bg-surface",
            )}
          >
            {option.value && <StatusDot status={option.value} />}
            {option.label}
            {option.count !== undefined && (
              <span className={clsx("font-mono text-[11px]", selected ? "text-white/70" : "text-faint")}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
