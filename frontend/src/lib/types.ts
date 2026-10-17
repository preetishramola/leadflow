export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal_sent", "won", "lost"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_note: string | null;
  last_discussion_at: string | null;
}

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

export interface StatusCounts {
  total: number;
  by_status: Record<LeadStatus, number>;
}

export interface NewLead {
  name: string;
  company?: string;
  phone?: string;
}

export interface LeadChanges {
  status?: LeadStatus;
  follow_up_at?: string | null;
}

export interface NewDiscussion {
  note: string;
  follow_up_at?: string | null;
}
