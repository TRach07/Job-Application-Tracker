import type {
  Application,
  ApplicationStatus,
  ApplicationSource,
  Email,
  FollowUp,
  StatusChange,
} from "@prisma/client";

export type ApplicationWithRelations = Application & {
  emails: Email[];
  followUps: FollowUp[];
  statusHistory: StatusChange[];
};

export type ApplicationCard = Pick<
  Application,
  | "id"
  | "company"
  | "position"
  | "status"
  | "location"
  | "appliedAt"
  | "nextAction"
  | "nextActionAt"
  | "source"
>;

export interface CreateApplicationInput {
  company: string;
  position: string;
  status?: ApplicationStatus;
  url?: string;
  salary?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  appliedAt?: Date;
  source?: ApplicationSource;
}

export interface UpdateApplicationInput {
  company?: string;
  position?: string;
  status?: ApplicationStatus;
  url?: string;
  salary?: string;
  location?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  nextAction?: string;
  nextActionAt?: Date;
}
