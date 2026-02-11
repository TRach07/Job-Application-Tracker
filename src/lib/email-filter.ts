/**
 * Deterministic pre-filter for emails BEFORE sending to AI.
 * Blocks newsletters, job alerts, automated notifications, etc.
 */

// Job platform and marketing domains (never direct recruiter communications)
const BLOCKED_SENDER_DOMAINS = [
  "linkedin.com",
  "facebookmail.com",
  "glassdoor.com",
  "glassdoor.fr",
  "indeed.com",
  "indeed.fr",
  "monster.com",
  "monster.fr",
  "welcometothejungle.com",
  "hellowork.com",
  "cadremploi.fr",
  "apec.fr",
  "francetravail.fr",
  "pole-emploi.fr",
  "jobteaser.com",
  "talent.io",
  "hired.com",
  "ziprecruiter.com",
  "stackoverflow.email",
  "dice.com",
  "angellist.com",
  "wellfound.com",
  "huntr.co",
  "meetup.com",
  "eventbrite.com",
  "mailchimp.com",
  "sendinblue.com",
  "brevo.com",
  "hubspot.com",
  "beehiiv.com",
  "substack.com",
  "medium.com",
  "coursera.org",
  "udemy.com",
  "skillshare.com",
  "meteojob.com",
  "regionsjob.com",
  "keljob.com",
  "staffme.fr",
  "leboncoin.fr",
  "wizbii.com",
];

// Automated sender prefixes
const BLOCKED_SENDER_PREFIXES = [
  "noreply@",
  "no-reply@",
  "no_reply@",
  "donotreply@",
  "do-not-reply@",
  "do_not_reply@",
  "notifications@",
  "notification@",
  "mailer-daemon@",
  "postmaster@",
  "marketing@",
  "newsletter@",
  "news@",
  "info@",
  "digest@",
  "alerts@",
  "alert@",
  "updates@",
  "jobs@",
  "careers@",
  "talent@",
  "bounce@",
  "automated@",
  "ne-pas-repondre@",
  "nepasrepondre@",
  "ne_pas_repondre@",
];

// Subject patterns to block (case-insensitive)
const BLOCKED_SUBJECT_PATTERNS = [
  "job alert",
  "alerte emploi",
  "alertes emploi",
  "alerte job",
  "new jobs",
  "nouveaux emplois",
  "nouvelles offres",
  "daily digest",
  "weekly digest",
  "digest hebdomadaire",
  "newsletter",
  "unsubscribe",
  "se desabonner",
  "se désabonner",
  "se desinscrire",
  "se désinscrire",
  "your job search",
  "votre recherche",
  "recommended jobs",
  "emplois recommandes",
  "emplois recommandés",
  "jobs matching",
  "offres correspondant",
  "who viewed your profile",
  "qui a consulte votre profil",
  "qui a consulté votre profil",
  "people also viewed",
  "is hiring",
  "recrute actuellement",
  "trending in your network",
  "daily job picks",
  "weekly job update",
  "job opportunities",
  "password reset",
  "verify your email",
  "confirm your email",
  "confirmez votre email",
  "account security",
  "two-factor",
  "double authentification",
  "you have new matches",
  "new connections",
  "nouvelles connexions",
  "apply now",
  "postulez maintenant",
  "top companies",
];

// Newsletter content signals (2+ matches = blocked)
const NEWSLETTER_CONTENT_SIGNALS = [
  "unsubscribe",
  "se désabonner",
  "se desabonner",
  "manage your preferences",
  "gérer vos préférences",
  "gerer vos preferences",
  "view in browser",
  "voir dans le navigateur",
  "this email was sent to",
  "cet email a été envoyé à",
  "cet email a ete envoye a",
  "if you no longer wish",
  "email preferences",
  "préférences email",
  "you are receiving this",
  "vous recevez cet email",
  "manage notifications",
  "gérer les notifications",
  "gerer les notifications",
  "update your settings",
  "mettre à jour vos paramètres",
  "opt out",
  "click here to stop",
];

export type EmailFilterStatusType =
  | "UNPROCESSED"
  | "PASSED"
  | "REJECTED_SENDER"
  | "REJECTED_SUBJECT"
  | "REJECTED_CONTENT"
  | "USER_OVERRIDE";

export interface FilterResult {
  passed: boolean;
  status: EmailFilterStatusType;
  reason: string | null;
}

/**
 * Extract email address from the "from" field (format "Name <email@domain.com>" or "email@domain.com")
 */
function extractEmail(from: string): string | null {
  const bracketMatch = from.match(/<([^>]+)>/);
  if (bracketMatch) return bracketMatch[1].toLowerCase();

  const directMatch = from.match(/([^\s<]+@[^\s>]+)/);
  if (directMatch) return directMatch[1].toLowerCase();

  return null;
}

/**
 * Extract domain from an email address
 */
function extractDomain(email: string): string | null {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1].toLowerCase() : null;
}

/**
 * Pre-filter an email before sending to AI.
 * Returns { passed: true } if the email should be analyzed by AI.
 * Returns { passed: false, status, reason } if the email is filtered out.
 */
export function preFilterEmail(email: {
  from: string;
  subject: string;
  bodyPreview: string;
}): FilterResult {
  const emailAddress = extractEmail(email.from);

  // 1. Check sender domain
  if (emailAddress) {
    const domain = extractDomain(emailAddress);
    if (domain) {
      const blockedDomain = BLOCKED_SENDER_DOMAINS.find(
        (d) => domain === d || domain.endsWith(`.${d}`)
      );
      if (blockedDomain) {
        return {
          passed: false,
          status: "REJECTED_SENDER",
          reason: `Automated platform: ${blockedDomain}`,
        };
      }
    }

    // 2. Check sender prefix
    const blockedPrefix = BLOCKED_SENDER_PREFIXES.find((prefix) =>
      emailAddress.startsWith(prefix)
    );
    if (blockedPrefix) {
      return {
        passed: false,
        status: "REJECTED_SENDER",
        reason: `Automated sender: ${blockedPrefix.replace("@", "")}`,
      };
    }
  }

  // 3. Check subject
  const subjectLower = email.subject.toLowerCase();
  const blockedSubject = BLOCKED_SUBJECT_PATTERNS.find((pattern) =>
    subjectLower.includes(pattern.toLowerCase())
  );
  if (blockedSubject) {
    return {
      passed: false,
      status: "REJECTED_SUBJECT",
      reason: `Subject filtered: "${blockedSubject}"`,
    };
  }

  // 4. Count newsletter signals in body
  const bodyLower = email.bodyPreview.toLowerCase();
  const signalCount = NEWSLETTER_CONTENT_SIGNALS.filter((signal) =>
    bodyLower.includes(signal.toLowerCase())
  ).length;

  if (signalCount >= 2) {
    return {
      passed: false,
      status: "REJECTED_CONTENT",
      reason: `Marketing/newsletter email (${signalCount} signals detected)`,
    };
  }

  // Email passes all filters
  return {
    passed: true,
    status: "PASSED",
    reason: null,
  };
}
