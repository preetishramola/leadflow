import type { LeadStatus } from "./types";

interface StatusStyle {
  label: string;
  dot: string;
  text: string;
  bg: string;
}

export const STATUS_STYLES: Record<LeadStatus, StatusStyle> = {
  new: { label: "New", dot: "#8a8579", text: "#4f4b44", bg: "#efede8" },
  contacted: { label: "Contacted", dot: "#3a6ea5", text: "#2c5684", bg: "#e8eff7" },
  qualified: { label: "Qualified", dot: "#2f8574", text: "#22685a", bg: "#e4f1ed" },
  proposal_sent: { label: "Proposal sent", dot: "#c08410", text: "#83590a", bg: "#f8efd9" },
  won: { label: "Won", dot: "#3c8a3a", text: "#2d6b2c", bg: "#e7f2e3" },
  lost: { label: "Lost", dot: "#b0574a", text: "#8c4237", bg: "#f6e8e5" },
};
