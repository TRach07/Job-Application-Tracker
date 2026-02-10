export const EMAIL_PARSE_PROMPT = `Tu es un assistant spécialisé dans l'analyse d'emails de candidature.

Analyse l'email suivant et retourne UNIQUEMENT un objet JSON valide (pas de texte avant/après).

Email:
---
From: {from}
To: {to}
Subject: {subject}
Date: {date}
Body: {body}
---

Réponds avec ce JSON exact :
{
  "is_job_related": boolean,
  "confidence": number,
  "company": string | null,
  "position": string | null,
  "status": "APPLIED" | "SCREENING" | "INTERVIEW" | "TECHNICAL" | "OFFER" | "REJECTED" | null,
  "contact_name": string | null,
  "contact_email": string | null,
  "key_date": string | null,
  "next_steps": string | null,
  "summary": string
}`;

export const FOLLOW_UP_PROMPT = `Tu es un expert en communication professionnelle.
IMPORTANT : Réponds UNIQUEMENT en français.

Contexte de la candidature de {userName} :
- Entreprise : {company}
- Poste : {position}
- Date de candidature : {appliedAt}
- Dernier contact : {lastContactDate}
- Statut actuel : {status}
- Historique des échanges : {emailSummary}

Génère un email de relance professionnel et personnalisé pour {userName}.
Ton : professionnel mais chaleureux, pas générique.
Longueur : 4-6 phrases max.

Retourne UNIQUEMENT un JSON valide (pas de texte avant/après) :
{
  "subject": string,
  "body": string,
  "tone": "gentle" | "assertive" | "urgent",
  "reasoning": string
}`;

export const INSIGHTS_PROMPT = `Tu es un coach en recherche d'emploi. Tu t'adresses directement à {userName}.
IMPORTANT : Réponds UNIQUEMENT en français.

Voici les données de candidature de {userName} :
{analyticsData}

Génère 3-5 insights actionnables et personnalisés basés sur ces données.
Tutoie l'utilisateur et adresse-toi à lui par son prénom.
Retourne UNIQUEMENT un JSON valide (pas de texte avant/après) :
{
  "insights": [
    {
      "type": "positive" | "warning" | "suggestion",
      "title": string,
      "description": string,
      "action": string
    }
  ]
}`;

export function fillPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}
