export interface EmailParseResult {
  is_job_related: boolean;
  confidence: number;
  rejection_reason: string;
  company: string | null;
  position: string | null;
  status:
    | "APPLIED"
    | "SCREENING"
    | "INTERVIEW"
    | "TECHNICAL"
    | "OFFER"
    | "REJECTED"
    | null;
  contact_name: string | null;
  contact_email: string | null;
  key_date: string | null;
  next_steps: string | null;
  summary: string;
}

export interface GmailMessageData {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export interface EmailReviewItem {
  id: string;
  gmailId: string;
  threadId: string | null;
  from: string;
  to: string;
  subject: string;
  bodyPreview: string;
  receivedAt: string;
  isInbound: boolean;
  filterStatus: string;
  filterReason: string | null;
  reviewStatus: string;
  aiAnalysis: EmailParseResult | null;
  parseError: string | null;
  existingApplication?: {
    id: string;
    company: string;
    position: string;
  } | null;
}

export interface EmailReviewAction {
  emailId: string;
  action: "approve" | "reject" | "edit_approve";
  editedCompany?: string;
  editedPosition?: string;
  editedStatus?: string;
  linkToApplicationId?: string;
}
