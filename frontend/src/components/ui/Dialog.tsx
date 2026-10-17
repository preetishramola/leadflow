"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import clsx from "clsx";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Rendered in the header row, to the left of the close button. */
  headerAside?: React.ReactNode;
  className?: string;
  /** Element id to focus when the dialog opens (defaults to the first focusable element). */
  initialFocusId?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  headerAside,
  className,
  initialFocusId,
  children,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="animate-overlay-in fixed inset-0 z-40 bg-[#1d1c1a]/30" />
        <RadixDialog.Content
          onOpenAutoFocus={(event) => {
            const target = initialFocusId && document.getElementById(initialFocusId);
            if (target) {
              event.preventDefault();
              target.focus();
            }
          }}
          className={clsx(
            "animate-panel-in fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "rounded-lg border border-line bg-surface shadow-[0_12px_40px_-12px_rgba(29,28,26,0.35)] focus:outline-none",
            className,
          )}
        >
          <header className="flex items-start gap-3 border-b border-line px-5 pt-4 pb-3.5">
            <div className="min-w-0 flex-1">
              <RadixDialog.Title className="truncate text-base font-semibold">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-0.5 text-[13px] text-muted">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">Dialog</RadixDialog.Description>
              )}
            </div>
            {headerAside}
            <RadixDialog.Close
              aria-label="Close"
              className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted hover:bg-hover hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </RadixDialog.Close>
          </header>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
