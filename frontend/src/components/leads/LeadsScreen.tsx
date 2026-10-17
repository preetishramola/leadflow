"use client";

import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Kbd } from "@/components/ui/Kbd";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useLeadCounts, useLeadList } from "@/hooks/useLeads";
import { useNow } from "@/hooks/useNow";
import { sectionLeads } from "@/lib/dates";
import type { Lead, LeadStatus } from "@/lib/types";
import { AddLeadDialog } from "./AddLeadDialog";
import { LeadList } from "./LeadList";
import { LeadTimelineDialog } from "./LeadTimelineDialog";
import { SearchInput } from "./SearchInput";
import { StatusFilter } from "./StatusFilter";

export function LeadsScreen() {
  const now = useNow();
  const [status, setStatus] = useState<LeadStatus | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [openLeadId, setOpenLeadId] = useState<number | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const leads = useLeadList({ status, search: debouncedSearch });
  const counts = useLeadCounts();

  useKeyboardShortcuts({
    "/": () => searchRef.current?.focus(),
    n: () => setIsAddingLead(true),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
      <header className="flex items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">LeadFlow</span>
        </div>
        <Button variant="primary" onClick={() => setIsAddingLead(true)}>
          <span aria-hidden="true" className="-ml-0.5 text-base leading-none">+</span>
          New lead
          <span className="hidden sm:inline">
            <Kbd>N</Kbd>
          </span>
        </Button>
      </header>

      <div className="mb-5 border-t border-line pt-6">
        <h1 className="text-xl font-semibold tracking-tight">{format(now, "EEEE, d MMMM")}</h1>
        <TodaySummary leads={leads.data} now={now} isFiltered={status !== null || debouncedSearch !== ""} />
      </div>

      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <StatusFilter value={status} counts={counts.data} onChange={setStatus} />
        <SearchInput ref={searchRef} value={search} onChange={setSearch} />
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {leads.isPending ? (
          <ListSkeleton />
        ) : leads.isError ? (
          <div className="px-6 py-14 text-center">
            <p className="font-medium">Couldn&apos;t load leads</p>
            <p className="mt-1 text-[13px] text-muted">{leads.error.message}</p>
            <Button className="mt-4" onClick={() => leads.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <LeadList
            leads={leads.data}
            now={now}
            isFiltered={status !== null || debouncedSearch !== ""}
            onOpen={setOpenLeadId}
            onAddLead={() => setIsAddingLead(true)}
          />
        )}
      </div>

      <LeadTimelineDialog leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
      <AddLeadDialog
        open={isAddingLead}
        onOpenChange={setIsAddingLead}
        onCreated={(lead) => setOpenLeadId(lead.id)}
      />
    </div>
  );
}

function TodaySummary({ leads, now, isFiltered }: { leads?: Lead[]; now: Date; isFiltered: boolean }) {
  if (!leads) return <p className="mt-1 h-5 text-[13px] text-muted" />;

  const { overdue, today } = sectionLeads(leads, now);
  const parts: string[] = [];
  if (today.length) parts.push(`${today.length} follow-up${today.length === 1 ? "" : "s"} due today`);
  if (overdue.length) parts.push(`${overdue.length} overdue`);
  const scope = isFiltered ? " in this view" : "";

  return (
    <p className="mt-1 text-[13px] text-muted">
      {parts.length ? `${parts.join(", ")}${scope}.` : `Nothing due today${scope}.`}
    </p>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading leads">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-line px-4 py-3.5 last:border-b-0">
          <div className="h-3.5 w-40 animate-pulse rounded-sm bg-hover" />
          <div className="h-3.5 w-20 animate-pulse rounded-sm bg-hover" />
          <div className="hidden h-3.5 flex-1 animate-pulse rounded-sm bg-hover md:block" />
        </div>
      ))}
    </div>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect width="22" height="22" rx="5" fill="var(--color-ink)" />
      <path d="M7 6v10h8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="7.5" r="1.6" fill="#7fc0a8" />
    </svg>
  );
}

/** Single-key shortcuts that are ignored while typing in a field or when a dialog is open. */
function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      const handler = handlersRef.current[event.key.toLowerCase()];
      if (handler) {
        event.preventDefault();
        handler();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
