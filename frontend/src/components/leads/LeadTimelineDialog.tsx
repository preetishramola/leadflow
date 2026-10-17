"use client";

import clsx from "clsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useDiscussions, useLead, useUpdateLead } from "@/hooks/useLeads";
import { useNow } from "@/hooks/useNow";
import { followUpState, formatWhen, overdueLabel } from "@/lib/dates";
import { STATUS_STYLES } from "@/lib/status";
import type { Lead } from "@/lib/types";
import { DISCUSSION_NOTE_ID, DiscussionForm } from "./DiscussionForm";
import { DiscussionTimeline } from "./DiscussionTimeline";
import { StatusSelect } from "./StatusSelect";

interface LeadTimelineDialogProps {
  leadId: number | null;
  onClose: () => void;
}

export function LeadTimelineDialog({ leadId, onClose }: LeadTimelineDialogProps) {
  const now = useNow();
  const lead = useLead(leadId);
  const discussions = useDiscussions(leadId);

  return (
    <Dialog
      open={leadId !== null}
      onOpenChange={(open) => !open && onClose()}
      className="h-[min(720px,calc(100dvh-2rem))] max-w-[640px]"
      initialFocusId={DISCUSSION_NOTE_ID}
      title={lead.data?.name ?? (lead.isError ? "Lead not found" : "Loading…")}
      description={lead.data ? <LeadContact lead={lead.data} /> : undefined}
      headerAside={lead.data && <LeadStatusControl lead={lead.data} />}
    >
      {lead.isError ? (
        <p className="px-5 py-10 text-center text-[13px] text-muted">{lead.error.message}</p>
      ) : (
        <>
          {lead.data?.follow_up_at && <FollowUpBar lead={lead.data} now={now} />}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <DiscussionTimeline
              discussions={discussions.data}
              isLoading={discussions.isPending}
              error={discussions.error}
              now={now}
            />
          </div>
          {leadId !== null && <DiscussionForm key={leadId} leadId={leadId} now={now} />}
        </>
      )}
    </Dialog>
  );
}

function LeadContact({ lead }: { lead: Lead }) {
  const parts = [lead.company, lead.phone].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No company or phone added";
}

function LeadStatusControl({ lead }: { lead: Lead }) {
  const updateLead = useUpdateLead(lead.id);
  return (
    <StatusSelect
      value={lead.status}
      disabled={updateLead.isPending}
      onChange={(status) => {
        if (status === lead.status) return;
        updateLead.mutate(
          { status },
          {
            onSuccess: () => toast.success(`Moved to ${STATUS_STYLES[status].label}.`),
            onError: (error) => toast.error(error.message),
          },
        );
      }}
    />
  );
}

function FollowUpBar({ lead, now }: { lead: Lead; now: Date }) {
  const updateLead = useUpdateLead(lead.id);
  const at = lead.follow_up_at!;
  const state = followUpState(at, now);
  const isLate = state === "overdue" || state === "late-today";

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-3 border-b px-5 py-2 text-[13px]",
        isLate ? "border-danger/20 bg-danger-soft text-danger" : "border-line bg-accent-soft/60 text-accent",
      )}
    >
      <span>
        <span className="font-medium">Follow-up {formatWhen(at, now)}</span>
        {state === "overdue" && <span> · {overdueLabel(at, now)}</span>}
      </span>
      <Button
        size="sm"
        variant="ghost"
        disabled={updateLead.isPending}
        onClick={() =>
          updateLead.mutate(
            { follow_up_at: null },
            {
              onSuccess: () => toast.success("Follow-up marked as done."),
              onError: (error) => toast.error(error.message),
            },
          )
        }
        className="text-current hover:bg-white/60"
      >
        Mark done
      </Button>
    </div>
  );
}
