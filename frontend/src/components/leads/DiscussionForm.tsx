"use client";

import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { Kbd } from "@/components/ui/Kbd";
import { useAddDiscussion } from "@/hooks/useLeads";
import { ApiError } from "@/lib/api";
import { followUpPresets, formatWhen, fromLocalInputValue, toLocalInputValue } from "@/lib/dates";

export const DISCUSSION_NOTE_ID = "discussion-note";

interface DiscussionFormProps {
  leadId: number;
  now: Date;
}

export function DiscussionForm({ leadId, now }: DiscussionFormProps) {
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(""); // datetime-local value, in the viewer's timezone
  const [errors, setErrors] = useState<{ note?: string; follow_up_at?: string }>({});
  const addDiscussion = useAddDiscussion(leadId);

  const followUpIso = fromLocalInputValue(followUp);
  const canSubmit = note.trim().length > 0 && !addDiscussion.isPending;

  function submit() {
    if (!canSubmit) return;
    if (followUpIso && new Date(followUpIso) <= new Date()) {
      setErrors({ follow_up_at: "Pick a time in the future." });
      return;
    }

    setErrors({});
    addDiscussion.mutate(
      { note: note.trim(), follow_up_at: followUpIso },
      {
        onSuccess: () => {
          toast.success(followUpIso ? `Logged. Follow-up set for ${formatWhen(followUpIso)}.` : "Discussion logged.");
          setNote("");
          setFollowUp("");
        },
        onError: (error) => {
          if (error instanceof ApiError && Object.keys(error.fieldErrors).length) {
            setErrors(error.fieldErrors);
          } else {
            toast.error(error.message);
          }
        },
      },
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="border-t border-line bg-paper/50 px-5 py-4"
    >
      <label htmlFor={DISCUSSION_NOTE_ID} className="sr-only">
        Discussion note
      </label>
      <textarea
        id={DISCUSSION_NOTE_ID}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            submit();
          }
        }}
        rows={3}
        maxLength={2000}
        placeholder="What did you talk about?"
        aria-invalid={Boolean(errors.note)}
        className={clsx(
          inputClass,
          "h-auto min-h-[76px] resize-y py-2 leading-relaxed",
          errors.note && "border-danger",
        )}
      />
      {errors.note && <p className="mt-1 text-xs text-danger">{errors.note}</p>}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 text-xs font-medium text-ink-soft">
            Follow-up <span className="font-normal text-faint">(optional)</span>
          </legend>
          <div className="flex flex-wrap items-center gap-1.5">
            {followUpPresets(now).map((preset) => {
              const value = toLocalInputValue(preset.date);
              const selected = value === followUp;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setFollowUp(selected ? "" : value);
                    setErrors((current) => ({ ...current, follow_up_at: undefined }));
                  }}
                  aria-pressed={selected}
                  title={formatWhen(preset.date.toISOString(), now)}
                  className={clsx(
                    "h-7 rounded-md border px-2 text-xs transition-colors",
                    selected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line-strong bg-surface text-ink-soft hover:border-faint",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
            <input
              type="datetime-local"
              aria-label="Follow-up date and time"
              value={followUp}
              min={toLocalInputValue(now)}
              onChange={(event) => {
                setFollowUp(event.target.value);
                setErrors((current) => ({ ...current, follow_up_at: undefined }));
              }}
              className={clsx(inputClass, "h-7 w-[180px] px-2 text-xs", errors.follow_up_at && "border-danger")}
            />
            {followUp && (
              <button
                type="button"
                onClick={() => setFollowUp("")}
                aria-label="Clear follow-up"
                className="grid size-7 place-items-center rounded-md text-muted hover:bg-hover hover:text-ink"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
          {errors.follow_up_at && <p className="mt-1 text-xs text-danger">{errors.follow_up_at}</p>}
        </fieldset>

        <Button type="submit" variant="primary" disabled={!canSubmit} className="self-end">
          {addDiscussion.isPending ? "Saving…" : "Log discussion"}
          <span className="hidden sm:inline">
            <Kbd>⌘↵</Kbd>
          </span>
        </Button>
      </div>
    </form>
  );
}
