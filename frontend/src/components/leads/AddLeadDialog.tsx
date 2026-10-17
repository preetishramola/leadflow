"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { TextField } from "@/components/ui/Field";
import { useCreateLead } from "@/hooks/useLeads";
import { ApiError } from "@/lib/api";
import type { Lead } from "@/lib/types";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (lead: Lead) => void;
}

export function AddLeadDialog({ open, onOpenChange, onCreated }: AddLeadDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New lead"
      description="Starts as New. You can log the first conversation right after."
      className="max-w-[440px]"
    >
      <AddLeadForm
        onCancel={() => onOpenChange(false)}
        onCreated={(lead) => {
          onOpenChange(false);
          onCreated(lead);
        }}
      />
    </Dialog>
  );
}

type FieldErrors = Partial<Record<"name" | "company" | "phone", string>>;

function AddLeadForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: "", company: "", phone: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const createLead = useCreateLead();

  function update(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: "Name is required." });
      return;
    }

    createLead.mutate(
      { name: form.name.trim(), company: form.company.trim() || undefined, phone: form.phone.trim() || undefined },
      {
        onSuccess: (lead) => {
          toast.success(`${lead.name} added.`);
          onCreated(lead);
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
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-3.5 px-5 py-4">
        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={update("name")}
          error={errors.name}
          placeholder="e.g. Priya Sharma"
          autoComplete="off"
          maxLength={120}
          autoFocus
          required
        />
        <TextField
          label="Company"
          hint="Optional"
          name="company"
          value={form.company}
          onChange={update("company")}
          error={errors.company}
          autoComplete="off"
          maxLength={120}
        />
        <TextField
          label="Phone"
          hint="Optional"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={update("phone")}
          error={errors.phone}
          placeholder="+91 98765 43210"
          autoComplete="off"
          maxLength={30}
        />
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={createLead.isPending}>
          {createLead.isPending ? "Adding…" : "Add lead"}
        </Button>
      </div>
    </form>
  );
}
