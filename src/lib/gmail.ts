import { prisma } from "@/lib/prisma";

const GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1/users/me";

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{
      mimeType: string;
      body?: { data?: string };
    }>;
  };
  internalDate: string;
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

function getHeader(
  headers: Array<{ name: string; value: string }>,
  name: string
): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function decodeBase64(data: string): string {
  const decoded = Buffer.from(
    data.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  ).toString("utf-8");
  return decoded;
}

function extractBody(payload: GmailMessage["payload"]): string {
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }
  if (payload.parts) {
    const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return decodeBase64(textPart.body.data);
    }
    const htmlPart = payload.parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      return decodeBase64(htmlPart.body.data).replace(/<[^>]+>/g, " ");
    }
  }
  return "";
}

async function refreshAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { refreshToken: true, accessToken: true },
  });

  if (!user?.refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: user.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = await response.json();
  const newAccessToken = data.access_token as string;

  await prisma.user.update({
    where: { id: userId },
    data: { accessToken: newAccessToken },
  });

  return newAccessToken;
}

async function gmailFetch(
  userId: string,
  path: string,
  retried = false
): Promise<Response> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true },
  });

  if (!user?.accessToken) {
    throw new Error("No access token available");
  }

  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${user.accessToken}` },
  });

  if (response.status === 401 && !retried) {
    await refreshAccessToken(userId);
    return gmailFetch(userId, path, true);
  }

  return response;
}

export async function listMessages(
  userId: string,
  query: string,
  maxResults = 100
): Promise<Array<{ id: string; threadId: string }>> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const response = await gmailFetch(userId, `/messages?${params}`);
  if (!response.ok) {
    throw new Error(`Gmail list messages failed: ${response.status}`);
  }

  const data = (await response.json()) as GmailListResponse;
  return data.messages || [];
}

export async function getMessage(
  userId: string,
  messageId: string
): Promise<{
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: Date;
}> {
  const response = await gmailFetch(userId, `/messages/${messageId}?format=full`);
  if (!response.ok) {
    throw new Error(`Gmail get message failed: ${response.status}`);
  }

  const msg = (await response.json()) as GmailMessage;
  const headers = msg.payload.headers;

  return {
    id: msg.id,
    threadId: msg.threadId,
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject"),
    body: extractBody(msg.payload),
    receivedAt: new Date(parseInt(msg.internalDate)),
  };
}

export const GMAIL_JOB_QUERY =
  '{in:inbox in:sent} (candidature OR "votre candidature" OR "your application" OR entretien OR interview OR "offre d\'emploi" OR "job offer" OR recrutement) -category:promotions -category:social -category:forums -from:noreply -from:no-reply -from:notifications -label:newsletter';
