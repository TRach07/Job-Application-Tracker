"use client";

import { useState } from "react";
import { z } from "zod";
import type { ApplicationStatus } from "@prisma/client";
import type { CreateApplicationInput } from "@/types/application";
import { STATUS_CONFIG, getStatusLabel } from "@/constants/status";
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
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationDictionary } from "@/i18n/types";

function createApplicationSchema(t: TranslationDictionary) {
  return z.object({
    company: z.string().min(1, t.applications.validationCompanyRequired),
    position: z.string().min(1, t.applications.validationPositionRequired),
    url: z.string().url(t.applications.validationUrlInvalid).optional().or(z.literal("")),
    salary: z.string().optional(),
    location: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z
      .string()
      .email(t.applications.validationEmailInvalid)
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
}

interface ApplicationFormProps {
  onSubmit: (data: CreateApplicationInput) => Promise<void>;
  onClose: () => void;
}

export function ApplicationForm({ onSubmit, onClose }: ApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();

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

    const applicationSchema = createApplicationSchema(t);
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

  const allStatuses = Object.keys(STATUS_CONFIG) as ApplicationStatus[];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">
            {t.applications.formCompanyLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company"
            placeholder={t.applications.formCompanyPlaceholder}
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
            {t.applications.formPositionLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="position"
            placeholder={t.applications.formPositionPlaceholder}
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
          <Label htmlFor="url">{t.applications.formUrlLabel}</Label>
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
          <Label htmlFor="salary">{t.applications.formSalaryLabel}</Label>
          <Input
            id="salary"
            placeholder={t.applications.formSalaryPlaceholder}
            value={formData.salary}
            onChange={(e) => updateField("salary", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">{t.applications.formLocationLabel}</Label>
          <Input
            id="location"
            placeholder={t.applications.formLocationPlaceholder}
            value={formData.location}
            onChange={(e) => updateField("location", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t.applications.formStatusLabel}</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => updateField("status", value)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder={t.applications.formStatusPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {allStatuses.map((key) => (
                <SelectItem key={key} value={key}>
                  {getStatusLabel(key, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">{t.applications.formContactNameLabel}</Label>
          <Input
            id="contactName"
            placeholder={t.applications.formContactNamePlaceholder}
            value={formData.contactName}
            onChange={(e) => updateField("contactName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">{t.applications.formContactEmailLabel}</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder={t.applications.formContactEmailPlaceholder}
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
        <Label htmlFor="notes">{t.applications.formNotesLabel}</Label>
        <Textarea
          id="notes"
          placeholder={t.applications.formNotesPlaceholder}
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
          {t.common.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t.applications.formSubmitting : t.applications.formSubmit}
        </Button>
      </div>
    </form>
  );
}
