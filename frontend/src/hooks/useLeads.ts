import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type LeadFilters } from "@/lib/api";
import type { LeadChanges, NewDiscussion, NewLead } from "@/lib/types";

export const leadKeys = {
  all: ["leads"] as const,
  list: (filters: LeadFilters) => ["leads", "list", filters] as const,
  counts: ["leads", "counts"] as const,
  detail: (id: number) => ["leads", "detail", id] as const,
  discussions: (id: number) => ["leads", "discussions", id] as const,
};

export function useLeadList(filters: LeadFilters) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => api.listLeads(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLeadCounts() {
  return useQuery({ queryKey: leadKeys.counts, queryFn: api.leadCounts });
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? -1),
    queryFn: () => api.getLead(id!),
    enabled: id !== null,
  });
}

export function useDiscussions(leadId: number | null) {
  return useQuery({
    queryKey: leadKeys.discussions(leadId ?? -1),
    queryFn: () => api.listDiscussions(leadId!),
    enabled: leadId !== null,
  });
}

/** Every write can change list order, pinning, counts and the open lead, so refresh all lead data. */
function useInvalidateLeads() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: leadKeys.all });
}

export function useCreateLead() {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (lead: NewLead) => api.createLead(lead),
    onSuccess: invalidate,
  });
}

export function useUpdateLead(id: number) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (changes: LeadChanges) => api.updateLead(id, changes),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadKeys.detail(id), lead);
      return invalidate();
    },
  });
}

export function useAddDiscussion(leadId: number) {
  const invalidate = useInvalidateLeads();
  return useMutation({
    mutationFn: (discussion: NewDiscussion) => api.addDiscussion(leadId, discussion),
    onSuccess: invalidate,
  });
}
