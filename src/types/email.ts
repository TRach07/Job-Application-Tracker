export interface EmailParseResult {
  is_job_related: boolean;
  confidence: number;
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
