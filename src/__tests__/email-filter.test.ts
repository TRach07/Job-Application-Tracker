import { describe, it, expect } from "vitest";
import { preFilterEmail } from "@/lib/email-filter";

describe("preFilterEmail", () => {
  describe("passes legitimate recruiter emails", () => {
    it("should pass a direct recruiter email", () => {
      const result = preFilterEmail({
        from: "Marie Dupont <marie.dupont@techcorp.com>",
        subject: "Votre candidature chez TechCorp",
        bodyPreview: "Bonjour, nous avons bien reçu votre candidature...",
      });
      expect(result.passed).toBe(true);
      expect(result.status).toBe("PASSED");
    });

    it("should pass an interview invitation", () => {
      const result = preFilterEmail({
        from: "hr@startup.io",
        subject: "Interview invitation - Software Engineer",
        bodyPreview:
          "We would like to invite you for an interview on Monday at 2pm...",
      });
      expect(result.passed).toBe(true);
      expect(result.status).toBe("PASSED");
    });

    it("should pass a rejection email", () => {
      const result = preFilterEmail({
        from: "recrutement@bigcorp.fr",
        subject: "Suite de votre candidature",
        bodyPreview:
          "Nous avons le regret de vous informer que votre candidature n'a pas été retenue...",
      });
      expect(result.passed).toBe(true);
      expect(result.status).toBe("PASSED");
    });
  });

  describe("blocks platform notifications", () => {
    it("should block LinkedIn emails", () => {
      const result = preFilterEmail({
        from: "messages-noreply@linkedin.com",
        subject: "New message from John",
        bodyPreview: "You have a new message...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });

    it("should block Indeed emails", () => {
      const result = preFilterEmail({
        from: "alert@indeed.com",
        subject: "5 new jobs matching your search",
        bodyPreview: "We found new jobs...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });

    it("should block Glassdoor emails", () => {
      const result = preFilterEmail({
        from: "noreply@glassdoor.com",
        subject: "Companies hiring near you",
        bodyPreview: "Check out these companies...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });
  });

  describe("blocks automated senders", () => {
    it("should block noreply@ addresses", () => {
      const result = preFilterEmail({
        from: "noreply@somecompany.com",
        subject: "Your account update",
        bodyPreview: "Your account has been updated...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });

    it("should block newsletter@ addresses", () => {
      const result = preFilterEmail({
        from: "newsletter@techblog.com",
        subject: "This week in tech",
        bodyPreview: "The latest news in tech...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });

    it("should block French no-reply addresses", () => {
      const result = preFilterEmail({
        from: "ne-pas-repondre@entreprise.fr",
        subject: "Confirmation",
        bodyPreview: "Votre inscription est confirmée...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });
  });

  describe("blocks by subject pattern", () => {
    it("should block job alert subjects", () => {
      const result = preFilterEmail({
        from: "team@customservice.com",
        subject: "Job Alert: 10 new developer positions",
        bodyPreview: "We found new positions...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SUBJECT");
    });

    it("should block French job alert subjects", () => {
      const result = preFilterEmail({
        from: "service@emploi.com",
        subject: "Alerte emploi : nouvelles offres",
        bodyPreview: "De nouvelles offres...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SUBJECT");
    });

    it("should block password reset emails", () => {
      const result = preFilterEmail({
        from: "security@bank.com",
        subject: "Password Reset Request",
        bodyPreview: "Click here to reset your password...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SUBJECT");
    });

    it("should block newsletter subjects", () => {
      const result = preFilterEmail({
        from: "team@company.com",
        subject: "Our monthly newsletter is here!",
        bodyPreview: "Read our latest updates...",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SUBJECT");
    });
  });

  describe("blocks newsletter content", () => {
    it("should block emails with 2+ newsletter signals", () => {
      const result = preFilterEmail({
        from: "team@randomcompany.com",
        subject: "Great news for you",
        bodyPreview:
          "Check out our latest features. Click here to unsubscribe. You are receiving this because you signed up. Manage your preferences here.",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_CONTENT");
    });

    it("should pass emails with only 1 newsletter signal", () => {
      const result = preFilterEmail({
        from: "recruiter@company.com",
        subject: "Following up on your application",
        bodyPreview:
          "Hi, I wanted to follow up on your application. To unsubscribe from future emails, click here.",
      });
      expect(result.passed).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty fields", () => {
      const result = preFilterEmail({
        from: "",
        subject: "",
        bodyPreview: "",
      });
      expect(result.passed).toBe(true);
    });

    it("should handle email in angle brackets", () => {
      const result = preFilterEmail({
        from: "John Doe <noreply@company.com>",
        subject: "Test",
        bodyPreview: "Test body",
      });
      expect(result.passed).toBe(false);
      expect(result.status).toBe("REJECTED_SENDER");
    });
  });
});
