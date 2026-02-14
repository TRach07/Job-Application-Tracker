import { describe, it, expect } from "vitest";
import {
  anonymizeEmailFields,
  anonymizeFollowUpFields,
  anonymizeInsightsFields,
  deanonymizeObject,
} from "@/lib/anonymizer";

describe("anonymizeEmailFields", () => {
  it("replaces from/to with placeholders", () => {
    const result = anonymizeEmailFields({
      from: "john@example.com",
      to: "hr@company.com",
      subject: "Candidature",
      body: "Bonjour",
    });
    expect(result.from).toBe("[EMAIL_1]");
    expect(result.to).toBe("[EMAIL_2]");
    expect(result.subject).toBe("Candidature");
  });

  it("anonymizes emails in body", () => {
    const result = anonymizeEmailFields({
      from: "a@b.com",
      to: "c@d.com",
      subject: "Test",
      body: "Contact me at john.doe@gmail.com",
    });
    expect(result.body).not.toContain("john.doe@gmail.com");
    expect(result.body).toContain("[EMAIL_");
  });

  it("anonymizes phone numbers", () => {
    const result = anonymizeEmailFields({
      from: "a@b.com",
      to: "c@d.com",
      subject: "Test",
      body: "Appelez-moi au 06 12 34 56 78",
    });
    expect(result.body).not.toContain("06 12 34 56 78");
    expect(result.body).toContain("[PHONE_");
  });

  it("anonymizes LinkedIn URLs", () => {
    const result = anonymizeEmailFields({
      from: "a@b.com",
      to: "c@d.com",
      subject: "Test",
      body: "Mon profil: https://linkedin.com/in/johndoe",
    });
    expect(result.body).not.toContain("linkedin.com/in/johndoe");
    expect(result.body).toContain("[PROFILE_URL_");
  });
});

describe("anonymizeInsightsFields", () => {
  it("replaces userName with [USER]", () => {
    const result = anonymizeInsightsFields({ userName: "Alice" });
    expect(result.userName).toBe("[USER]");
    expect(result.mapping.get("[USER]")).toBe("Alice");
  });
});

describe("deanonymizeObject", () => {
  it("restores strings", () => {
    const mapping = new Map([["[USER]", "Alice"]]);
    expect(deanonymizeObject("Hello [USER]", mapping)).toBe("Hello Alice");
  });

  it("restores nested objects", () => {
    const mapping = new Map([["[USER]", "Alice"]]);
    const obj = { title: "Hi [USER]", items: ["[USER] rocks"] };
    const result = deanonymizeObject(obj, mapping);
    expect(result.title).toBe("Hi Alice");
    expect(result.items[0]).toBe("Alice rocks");
  });

  it("handles null/undefined", () => {
    const mapping = new Map();
    expect(deanonymizeObject(null, mapping)).toBeNull();
    expect(deanonymizeObject(undefined, mapping)).toBeUndefined();
  });
});
