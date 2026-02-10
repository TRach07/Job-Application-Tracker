export interface GeneratedFollowUp {
  subject: string;
  body: string;
  tone: "gentle" | "assertive" | "urgent";
  reasoning: string;
}

export interface AIInsight {
  type: "positive" | "warning" | "suggestion";
  title: string;
  description: string;
  action: string;
}

export interface AIInsightsResponse {
  insights: AIInsight[];
}
