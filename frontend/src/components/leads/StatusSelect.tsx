"use client";

import * as Select from "@radix-ui/react-select";
import { STATUS_STYLES } from "@/lib/status";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/types";
import { StatusDot } from "./StatusBadge";

interface StatusSelectProps {
  value: LeadStatus;
  disabled?: boolean;
  onChange: (status: LeadStatus) => void;
}

export function StatusSelect({ value, disabled, onChange }: StatusSelectProps) {
  const current = STATUS_STYLES[value];

  return (
    <Select.Root value={value} onValueChange={(next) => onChange(next as LeadStatus)} disabled={disabled}>
      <Select.Trigger
        aria-label="Lead status"
        className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-line-strong px-2.5 text-[13px] font-medium transition-colors hover:bg-hover disabled:opacity-60 data-[state=open]:bg-hover"
        style={{ color: current.text }}
      >
        <StatusDot status={value} />
        <Select.Value />
        <Select.Icon className="text-muted">
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 3.75L5 6.75l3-3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          align="end"
          className="z-50 min-w-[170px] rounded-md border border-line bg-surface p-1 shadow-[0_8px_24px_-8px_rgba(29,28,26,0.25)]"
        >
          <Select.Viewport>
            {LEAD_STATUSES.map((status) => (
              <Select.Item
                key={status}
                value={status}
                className="flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2 text-[13px] text-ink outline-none select-none data-[highlighted]:bg-hover"
              >
                <StatusDot status={status} />
                <Select.ItemText>{STATUS_STYLES[status].label}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto text-muted">
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2.5 6.2l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
