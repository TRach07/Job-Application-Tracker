export const EMAIL_PARSE_PROMPT = `Tu es un classificateur d'emails de candidature d'emploi. Tu dois determiner si un email est une COMMUNICATION DIRECTE liee a une candidature specifique.

REPONDS UNIQUEMENT avec un objet JSON valide. Aucun texte avant ou apres le JSON.

=== REGLES STRICTES ===

Un email EST lie a une candidature (is_job_related: true) UNIQUEMENT si c'est :
- Un accuse de reception d'une candidature envoyee ("nous avons bien recu votre candidature")
- Une reponse d'un recruteur ou RH a propos d'une candidature specifique
- Une convocation a un entretien (avec date, heure, lieu ou lien)
- Un test technique ou exercice envoye par l'entreprise
- Une offre d'emploi formelle adressee personnellement au candidat
- Un refus/rejet d'une candidature specifique
- Un email ENVOYE par le candidat pour postuler ou relancer

Un email N'EST PAS lie a une candidature (is_job_related: false) si c'est :
- Une alerte emploi ou notification de plateforme (LinkedIn, Indeed, Glassdoor, etc.)
- Une newsletter ou email marketing
- Un email qui mentionne des emplois/postes sans etre une communication directe
- Une notification automatique ("X personnes ont vu votre profil")
- Un email d'information generale sur le recrutement dans une entreprise
- Un email de confirmation d'inscription a un site d'emploi
- Un email commercial qui utilise des mots comme "opportunite" ou "offre"

=== EMAIL A ANALYSER ===
Note : Les champs "De" et "A" contiennent des identifiants anonymises comme [EMAIL_1]. C'est normal. Pour contact_email, utilise le placeholder tel quel si c'est l'email de l'expediteur.

De: {from}
A: {to}
Objet: {subject}
Date: {date}
Corps: {body}

=== FORMAT DE REPONSE (JSON uniquement, aucun texte avant ou apres) ===
{
  "is_job_related": true ou false,
  "confidence": nombre entre 0.0 et 1.0,
  "rejection_reason": "explication de ta decision",
  "company": "nom de l'entreprise ou null",
  "position": "intitule du poste ou null",
  "status": "APPLIED|SCREENING|INTERVIEW|TECHNICAL|OFFER|REJECTED ou null",
  "contact_name": "nom du contact ou null",
  "contact_email": "email du contact ou null",
  "key_date": "date importante au format YYYY-MM-DD ou null",
  "next_steps": "prochaines etapes ou null",
  "summary": "resume court de l'email"
}

REGLES pour remplir le JSON :
- Analyse l'email objectivement. Si c'est une VRAIE communication d'entreprise/recruteur a propos d'une candidature, mets is_job_related: true.
- Si c'est une alerte, newsletter, notification de plateforme, mets is_job_related: false.
- confidence: mets une valeur haute (>0.9) si tu es tres sur de ta reponse.
- rejection_reason: explique TOUJOURS pourquoi tu as choisi true ou false, en te basant sur le CONTENU REEL de l'email.
- status: utilise uniquement ces valeurs exactes si is_job_related est true: "APPLIED", "SCREENING", "INTERVIEW", "TECHNICAL", "OFFER", "REJECTED". Sinon null.
- NE COPIE PAS d'exemple. Analyse chaque email individuellement.`;

export const FOLLOW_UP_PROMPT = `Tu es un expert en communication professionnelle.
IMPORTANT : Réponds UNIQUEMENT en français.

Contexte de la candidature de {userName} :
- Entreprise : {company}
- Poste : {position}
- Date de candidature : {appliedAt}
- Dernier contact : {lastContactDate}
- Statut actuel : {status}
- Historique des échanges : {emailSummary}

Note : Le nom de l'utilisateur peut apparaitre sous forme anonymisee [USER]. Utilise ce placeholder tel quel dans l'email genere.

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
