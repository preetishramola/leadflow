import { STATUS_STYLES } from "@/lib/status";
import type { LeadStatus } from "@/lib/types";

export function StatusDot({ status }: { status: LeadStatus }) {
  return <span className="size-1.5 shrink-0 rounded-full" style={{ background: STATUS_STYLES[status].dot }} />;
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex h-[22px] items-center gap-1.5 rounded-sm px-1.5 text-xs font-medium whitespace-nowrap"
      style={{ color: style.text, background: style.bg }}
    >
      <StatusDot status={status} />
      {style.label}
    </span>
  );
}
