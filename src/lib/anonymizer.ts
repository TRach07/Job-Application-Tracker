export type AnonymizationMap = Map<string, string>;

export interface EmailFieldsAnonymized {
  from: string;
  to: string;
  subject: string;
  body: string;
  mapping: AnonymizationMap;
}

class PlaceholderCounter {
  private counters = new Map<string, number>();

  next(prefix: string): string {
    const count = (this.counters.get(prefix) || 0) + 1;
    this.counters.set(prefix, count);
    return `[${prefix}_${count}]`;
  }
}

// --- PII detection patterns ---

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const PROFILE_URL_REGEX =
  /https?:\/\/(?:www\.)?(?:linkedin\.com\/in\/|github\.com\/|twitter\.com\/|x\.com\/)[^\s,)}\]>]+/gi;

const PHONE_PATTERNS: RegExp[] = [
  /\+33[\s.\-]?\d[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}/g,
  /0[1-7][\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}/g,
  /\+212[\s.\-]?\d[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}/g,
  /\+1[\s.\-]?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g,
  /\+\d{1,3}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{2,4}[\s.\-]?\d{0,4}/g,
];

const ADDRESS_REGEX =
  /\d{1,5}[\s,]+(?:rue|avenue|boulevard|bd|av|place|all[ée]e|impasse|chemin|route)\s+[A-ZÀ-Ü][a-zà-ü\s]+(?:,?\s*\d{5}\s+[A-ZÀ-Ü][a-zà-ü\s]+)?/gi;

const NAME_GREETING_REGEX =
  /(?:Bonjour|Bonsoir|Cher|Ch[eè]re|Dear|Hi|Hello|Salut)\s+(?:M\.|Mme|Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Monsieur|Madame)?\s*([A-ZÀ-Ü][a-zà-ü]+(?:[\s\-][A-ZÀ-Ü][a-zà-ü]+){0,2})/g;

const NAME_SIGNATURE_REGEX =
  /(?:Cordialement|Bien cordialement|Bien [àa] vous|Sinc[èe]rement|Regards|Best regards|Kind regards|Merci|Thanks|Cdlt|Cdt)\s*,?\s*\n\s*([A-ZÀ-Ü][a-zà-ü]+(?:[\s\-][A-ZÀ-Ü][a-zà-ü]+){0,2})/gi;

// --- Replacement helpers ---

function replaceAllMatches(
  text: string,
  regex: RegExp,
  prefix: string,
  counter: PlaceholderCounter,
  mapping: AnonymizationMap,
): string {
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags))];
  if (matches.length === 0) return text;

  const seen = new Map<string, string>();
  for (const match of matches) {
    const original = match[0];
    if (!seen.has(original)) {
      const placeholder = counter.next(prefix);
      seen.set(original, placeholder);
      mapping.set(placeholder, original);
    }
  }

  let result = text;
  for (const [original, placeholder] of seen) {
    result = result.split(original).join(placeholder);
  }
  return result;
}

function replaceNameCaptures(
  text: string,
  regex: RegExp,
  prefix: string,
  counter: PlaceholderCounter,
  mapping: AnonymizationMap,
): string {
  const matches = [...text.matchAll(new RegExp(regex.source, regex.flags))];

  const seen = new Map<string, string>();
  for (const match of matches) {
    const name = match[1]?.trim();
    if (!name || name.length < 3) continue;
    if (!seen.has(name)) {
      const placeholder = counter.next(prefix);
      seen.set(name, placeholder);
      mapping.set(placeholder, name);
    }
  }

  let result = text;
  for (const [name, placeholder] of seen) {
    result = result.split(name).join(placeholder);
  }
  return result;
}

function anonymizeTextBlock(
  text: string,
  counter: PlaceholderCounter,
  mapping: AnonymizationMap,
): string {
  let result = text;

  // Order matters: URLs first (contain email-like substrings), then emails, then phones
  result = replaceAllMatches(result, PROFILE_URL_REGEX, "PROFILE_URL", counter, mapping);
  result = replaceAllMatches(result, EMAIL_REGEX, "EMAIL", counter, mapping);
  for (const pattern of PHONE_PATTERNS) {
    result = replaceAllMatches(result, pattern, "PHONE", counter, mapping);
  }
  result = replaceAllMatches(result, ADDRESS_REGEX, "ADDRESS", counter, mapping);
  result = replaceNameCaptures(result, NAME_GREETING_REGEX, "NAME", counter, mapping);
  result = replaceNameCaptures(result, NAME_SIGNATURE_REGEX, "NAME", counter, mapping);

  return result;
}

// --- Public API ---

export function anonymizeEmailFields(fields: {
  from: string;
  to: string;
  subject: string;
  body: string;
}): EmailFieldsAnonymized {
  const mapping: AnonymizationMap = new Map();
  const counter = new PlaceholderCounter();

  const fromPlaceholder = counter.next("EMAIL");
  mapping.set(fromPlaceholder, fields.from);

  const toPlaceholder = counter.next("EMAIL");
  mapping.set(toPlaceholder, fields.to);

  const anonymizedBody = anonymizeTextBlock(fields.body, counter, mapping);

  return {
    from: fromPlaceholder,
    to: toPlaceholder,
    subject: fields.subject,
    body: anonymizedBody,
    mapping,
  };
}

export function anonymizeFollowUpFields(fields: {
  userName: string;
  emailSummary: string;
}): { userName: string; emailSummary: string; mapping: AnonymizationMap } {
  const mapping: AnonymizationMap = new Map();
  const counter = new PlaceholderCounter();

  const userPlaceholder = "[USER]";
  mapping.set(userPlaceholder, fields.userName);

  const anonymizedSummary = anonymizeTextBlock(fields.emailSummary, counter, mapping);

  return {
    userName: userPlaceholder,
    emailSummary: anonymizedSummary,
    mapping,
  };
}

export function anonymizeInsightsFields(fields: {
  userName: string;
}): { userName: string; mapping: AnonymizationMap } {
  const mapping: AnonymizationMap = new Map();
  mapping.set("[USER]", fields.userName);
  return { userName: "[USER]", mapping };
}

// --- De-anonymization ---

function deanonymize(text: string, mapping: AnonymizationMap): string {
  let result = text;
  for (const [placeholder, original] of mapping) {
    result = result.split(placeholder).join(original);
  }
  return result;
}

export function deanonymizeObject<T>(obj: T, mapping: AnonymizationMap): T {
  if (typeof obj === "string") {
    return deanonymize(obj, mapping) as T;
  }
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deanonymizeObject(item, mapping)) as T;
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = deanonymizeObject(value, mapping);
    }
    return result as T;
  }
  return obj;
}
