import type { Discussion, Lead, LeadChanges, LeadStatus, NewDiscussion, NewLead, StatusCounts } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Can't reach the server. Is the API running?", 0);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, body?.errors ?? {});
  }

  return response.json() as Promise<T>;
}

export interface LeadFilters {
  status: LeadStatus | null;
  search: string;
}

export const api = {
  listLeads({ status, search }: LeadFilters) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    const query = params.toString();
    return request<Lead[]>(`/api/leads${query ? `?${query}` : ""}`);
  },

  leadCounts: () => request<StatusCounts>("/api/leads/counts"),

  getLead: (id: number) => request<Lead>(`/api/leads/${id}`),

  createLead: (lead: NewLead) => request<Lead>("/api/leads", { method: "POST", body: JSON.stringify(lead) }),

  updateLead: (id: number, changes: LeadChanges) =>
    request<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),

  listDiscussions: (leadId: number) => request<Discussion[]>(`/api/leads/${leadId}/discussions`),

  addDiscussion: (leadId: number, discussion: NewDiscussion) =>
    request<Discussion>(`/api/leads/${leadId}/discussions`, {
      method: "POST",
      body: JSON.stringify(discussion),
    }),
};
