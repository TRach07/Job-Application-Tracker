"use client";

import { useState } from "react";
import { z } from "zod";
import type { ApplicationStatus } from "@prisma/client";
import type { CreateApplicationInput } from "@/types/application";
import { STATUS_CONFIG } from "@/constants/status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const applicationSchema = z.object({
  company: z.string().min(1, "Le nom de l'entreprise est requis"),
  position: z.string().min(1, "Le poste est requis"),
  url: z.string().url("URL invalide").optional().or(z.literal("")),
  salary: z.string().optional(),
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z
    .string()
    .email("Email invalide")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  status: z
    .enum([
      "APPLIED",
      "SCREENING",
      "INTERVIEW",
      "TECHNICAL",
      "OFFER",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
      "NO_RESPONSE",
    ])
    .optional(),
});

interface ApplicationFormProps {
  onSubmit: (data: CreateApplicationInput) => Promise<void>;
  onClose: () => void;
}

export function ApplicationForm({ onSubmit, onClose }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    url: "",
    salary: "",
    location: "",
    contactName: "",
    contactEmail: "",
    notes: "",
    status: "APPLIED" as ApplicationStatus,
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = applicationSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0];
        if (path) {
          fieldErrors[String(path)] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateApplicationInput = {
        company: formData.company,
        position: formData.position,
        status: formData.status,
        ...(formData.url && { url: formData.url }),
        ...(formData.salary && { salary: formData.salary }),
        ...(formData.location && { location: formData.location }),
        ...(formData.contactName && { contactName: formData.contactName }),
        ...(formData.contactEmail && { contactEmail: formData.contactEmail }),
        ...(formData.notes && { notes: formData.notes }),
      };
      await onSubmit(input);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allStatuses = Object.entries(STATUS_CONFIG) as [
    ApplicationStatus,
    (typeof STATUS_CONFIG)[ApplicationStatus],
  ][];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">
            Entreprise <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company"
            placeholder="Nom de l'entreprise"
            value={formData.company}
            onChange={(e) => updateField("company", e.target.value)}
            aria-invalid={!!errors.company}
          />
          {errors.company && (
            <p className="text-xs text-destructive">{errors.company}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">
            Poste <span className="text-destructive">*</span>
          </Label>
          <Input
            id="position"
            placeholder="Titre du poste"
            value={formData.position}
            onChange={(e) => updateField("position", e.target.value)}
            aria-invalid={!!errors.position}
          />
          {errors.position && (
            <p className="text-xs text-destructive">{errors.position}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="url">URL de l&apos;offre</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            value={formData.url}
            onChange={(e) => updateField("url", e.target.value)}
            aria-invalid={!!errors.url}
          />
          {errors.url && (
            <p className="text-xs text-destructive">{errors.url}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary">Salaire</Label>
          <Input
            id="salary"
            placeholder="ex: 45k-55k EUR"
            value={formData.salary}
            onChange={(e) => updateField("salary", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Localisation</Label>
          <Input
            id="location"
            placeholder="Ville, Pays ou Remote"
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Statut initial</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField("status", value)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Selectionner un statut" />
            </SelectTrigger>
            <SelectContent>
              {allStatuses.map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Nom du contact</Label>
          <Input
            id="contactName"
            placeholder="Prenom Nom"
            value={formData.contactName}
            onChange={(e) => updateField("contactName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email du contact</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="contact@entreprise.com"
            value={formData.contactEmail}
            onChange={(e) => updateField("contactEmail", e.target.value)}
            aria-invalid={!!errors.contactEmail}
          />
          {errors.contactEmail && (
            <p className="text-xs text-destructive">{errors.contactEmail}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Informations supplementaires..."
          value={formData.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Ajout en cours..." : "Ajouter la candidature"}
        </Button>
      </div>
    </form>
  );
}
