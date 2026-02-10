import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Use existing Google account or create test user
  let user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Utilisateur Test",
      },
    });
  }

  console.log(`Using user: ${user.email} (${user.id})`);

  // Create sample applications
  const applications = [
    {
      company: "Google",
      position: "Software Engineer L5",
      status: "INTERVIEW" as const,
      location: "Paris, France",
      url: "https://careers.google.com",
      contactName: "Marie Dupont",
      contactEmail: "marie@google.com",
      appliedAt: new Date("2025-01-15"),
      source: "MANUAL" as const,
    },
    {
      company: "Microsoft",
      position: "Senior Frontend Developer",
      status: "APPLIED" as const,
      location: "Remote",
      salary: "70k-90k EUR",
      appliedAt: new Date("2025-01-20"),
      source: "MANUAL" as const,
    },
    {
      company: "Datadog",
      position: "Full Stack Engineer",
      status: "TECHNICAL" as const,
      location: "Paris, France",
      contactName: "Pierre Martin",
      appliedAt: new Date("2025-01-10"),
      nextAction: "Test technique le 5 février",
      source: "EMAIL_DETECTED" as const,
    },
    {
      company: "Doctolib",
      position: "Développeur React",
      status: "SCREENING" as const,
      location: "Paris, France",
      appliedAt: new Date("2025-01-22"),
      source: "MANUAL" as const,
    },
    {
      company: "BlaBlaCar",
      position: "Backend Engineer (Node.js)",
      status: "OFFER" as const,
      location: "Paris, France",
      salary: "65k-80k EUR",
      contactName: "Sophie Leroy",
      appliedAt: new Date("2024-12-20"),
      nextAction: "Répondre à l'offre avant le 10 février",
      source: "MANUAL" as const,
    },
    {
      company: "Stripe",
      position: "Software Engineer",
      status: "REJECTED" as const,
      location: "Dublin, Ireland",
      appliedAt: new Date("2024-12-15"),
      source: "EMAIL_DETECTED" as const,
    },
    {
      company: "Amazon",
      position: "SDE II",
      status: "APPLIED" as const,
      location: "Luxembourg",
      appliedAt: new Date("2025-01-25"),
      source: "MANUAL" as const,
    },
    {
      company: "Revolut",
      position: "Senior TypeScript Engineer",
      status: "NO_RESPONSE" as const,
      location: "Remote",
      appliedAt: new Date("2024-12-01"),
      source: "MANUAL" as const,
    },
    {
      company: "Qonto",
      position: "Full Stack Developer",
      status: "APPLIED" as const,
      location: "Paris, France",
      appliedAt: new Date("2025-01-28"),
      source: "MANUAL" as const,
    },
    {
      company: "Alan",
      position: "Frontend Engineer",
      status: "SCREENING" as const,
      location: "Paris, France",
      contactEmail: "recrutement@alan.com",
      appliedAt: new Date("2025-01-18"),
      source: "EMAIL_DETECTED" as const,
    },
  ];

  for (const app of applications) {
    await prisma.application.create({
      data: {
        ...app,
        userId: user.id,
      },
    });
  }

  console.log("Seed completed: 10 applications created for test user.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
