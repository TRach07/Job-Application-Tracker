import { describe, it, expect } from "vitest";

// Replicate the normalizeText logic from follow-up.service.ts
// (private function, tested here to ensure matching logic is correct)
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

describe("normalizeText (follow-up matching logic)", () => {
  it("collapses multiple spaces", () => {
    expect(normalizeText("hello    world")).toBe("hello world");
  });

  it("trims whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("lowercases text", () => {
    expect(normalizeText("Bonjour Monsieur")).toBe("bonjour monsieur");
  });

  it("normalizes tabs and newlines", () => {
    expect(normalizeText("hello\n\tworld\n")).toBe("hello world");
  });

  it("matches draft snippet against sent email body", () => {
    const draft =
      "Bonjour,\n\nJe me permets de vous relancer concernant ma candidature pour le poste de Développeur Fullstack.";
    const sent =
      "Bonjour,  Je me permets de vous relancer concernant ma candidature pour le poste de Développeur Fullstack. Cordialement";

    const normalizedDraft = normalizeText(draft);
    const normalizedSent = normalizeText(sent);
    const snippet = normalizedDraft.substring(0, 100);

    expect(normalizedSent.includes(snippet)).toBe(true);
  });

  it("does not match unrelated texts", () => {
    const draft = "Bonjour, je souhaite postuler au poste de designer.";
    const sent = "Merci pour votre retour rapide concernant le stage.";

    const normalizedDraft = normalizeText(draft);
    const normalizedSent = normalizeText(sent);
    const snippet = normalizedDraft.substring(0, 100);

    expect(normalizedSent.includes(snippet)).toBe(false);
  });
});
