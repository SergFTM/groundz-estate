import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── Clean existing data (FK-safe order) ─────────────────
  await prisma.passwordReset.deleteMany();
  await prisma.investorInvestment.deleteMany();
  await prisma.constructionMedia.deleteMany();
  await prisma.constructionPhase.deleteMany();
  await prisma.leadNote.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.investmentPool.deleteMany();
  await prisma.article.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.user.deleteMany();

  // ── Users (6) ────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("develta123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@develta.cy",
      password: hashedPassword,
      role: "internal_team",
      name: "Sarah Admin",
      phone: "+357 96 456789",
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@develta.cy",
      password: hashedPassword,
      role: "buyer",
      name: "Maria Petrova",
      phone: "+357 96 123456",
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: "buyer2@develta.cy",
      password: hashedPassword,
      role: "buyer",
      name: "Andreas Christodoulou",
      phone: "+357 96 654321",
    },
  });

  const investor = await prisma.user.create({
    data: {
      email: "investor@develta.cy",
      password: hashedPassword,
      role: "investor",
      name: "Alexander Chen",
      phone: "+357 96 234567",
    },
  });

  const agent = await prisma.user.create({
    data: {
      email: "agent@develta.cy",
      password: hashedPassword,
      role: "agent",
      name: "Nikos Papadopoulos",
      phone: "+357 96 345678",
    },
  });

  await prisma.user.create({
    data: {
      email: "team@develta.cy",
      password: hashedPassword,
      role: "internal_team",
      name: "Develta Team",
      phone: "+357 96 567890",
    },
  });

  console.log("  Created 6 users (password: develta123)");

  // ── Projects (5) ─────────────────────────────────────────
  const sungardo = await prisma.project.create({
    data: {
      name: "Sungardo",
      slug: "sungardo",
      location: "Limassol Marina",
      description: "A premium waterfront development offering luxury living with stunning marina views.",
      imageUrl: "/images/projects/sungardo.svg",
      status: "active",
    },
  });

  const antigoneCourt = await prisma.project.create({
    data: {
      name: "Antigone Court",
      slug: "antigone-court",
      location: "Germasogeia",
      description: "Modern residential complex in the heart of Germasogeia with easy access to the beach.",
      imageUrl: "/images/projects/antigone-court.svg",
      status: "active",
    },
  });

  const symphonyResidence = await prisma.project.create({
    data: {
      name: "Symphony Residence",
      slug: "symphony-residence",
      location: "Tourist Area, Limassol",
      description: "Elegant apartments in Limassol's sought-after tourist area, minutes from the sea.",
      imageUrl: "/images/projects/symphony-residence.svg",
      status: "active",
    },
  });

  const cascadaResidence = await prisma.project.create({
    data: {
      name: "Cascada Residence",
      slug: "cascada-residence",
      location: "Mouttagiaka",
      description: "Upcoming coastal development with panoramic sea views and contemporary design.",
      imageUrl: "/images/projects/cascada-residence.svg",
      status: "coming_soon",
    },
  });

  const ptolemyStudios = await prisma.project.create({
    data: {
      name: "Ptolemy Studios",
      slug: "ptolemy-studios",
      location: "Historical Center",
      description: "Boutique studio apartments in Limassol's charming historical center.",
      imageUrl: "/images/projects/ptolemy-studios.svg",
      status: "completed",
    },
  });

  console.log("  Created 5 projects");

  // ── Units (22) ───────────────────────────────────────────
  const units = await Promise.all([
    // Sungardo — 5 units
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 45, price: 175000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 65, price: 280000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-202", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 95, price: 420000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 130, price: 580000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-PH1", type: "penthouse", bedrooms: 3, floor: 5, areaSqm: 180, price: 950000, status: "available" } }),

    // Antigone Court — 5 units (AC-201 now sold, linked to buyer2)
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 42, price: 160000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-102", type: "1bed", bedrooms: 1, floor: 1, areaSqm: 58, price: 225000, status: "available" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-201", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 88, price: 365000, status: "sold", buyerId: buyer2.id } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 120, price: 480000, status: "available" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-PH1", type: "penthouse", bedrooms: 3, floor: 4, areaSqm: 165, price: 820000, status: "available" } }),

    // Symphony Residence — 5 units (SYM-202 linked to buyer)
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 48, price: 190000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 68, price: 310000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-202", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 92, price: 450000, status: "available", buyerId: buyer.id } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 135, price: 620000, status: "available" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-PH1", type: "penthouse", bedrooms: 4, floor: 6, areaSqm: 200, price: 1150000, status: "available" } }),

    // Cascada Residence — 3 units
    prisma.unit.create({ data: { projectId: cascadaResidence.id, code: "CAS-101", type: "1bed", bedrooms: 1, floor: 1, areaSqm: 62, price: 260000, status: "available" } }),
    prisma.unit.create({ data: { projectId: cascadaResidence.id, code: "CAS-201", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 98, price: 480000, status: "available" } }),
    prisma.unit.create({ data: { projectId: cascadaResidence.id, code: "CAS-PH1", type: "penthouse", bedrooms: 3, floor: 4, areaSqm: 175, price: 890000, status: "available" } }),

    // Ptolemy Studios — 4 units (all sold)
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 38, price: 155000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-102", type: "studio", bedrooms: 0, floor: 1, areaSqm: 40, price: 162000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 55, price: 220000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-202", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 60, price: 245000, status: "sold" } }),
  ]);

  console.log(`  Created ${units.length} units (8 sold, 3 reserved, 11 available)`);

  // ── Construction Phases (Symphony Residence) ─────────────
  const phase1 = await prisma.constructionPhase.create({
    data: {
      projectId: symphonyResidence.id,
      name: "Site Preparation & Excavation",
      description: "Land clearing, excavation, and site grading completed on schedule.",
      status: "completed",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-10-31"),
      sortOrder: 1,
    },
  });
  const phase2 = await prisma.constructionPhase.create({
    data: {
      projectId: symphonyResidence.id,
      name: "Foundation & Substructure",
      description: "Reinforced concrete foundations and underground parking structure.",
      status: "completed",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2025-12-31"),
      sortOrder: 2,
    },
  });
  const phase3 = await prisma.constructionPhase.create({
    data: {
      projectId: symphonyResidence.id,
      name: "Superstructure Framework",
      description: "Main building structure, floor slabs, columns, and exterior walls.",
      status: "in_progress",
      startDate: new Date("2026-01-15"),
      endDate: new Date("2026-03-31"),
      sortOrder: 3,
    },
  });
  const phase4 = await prisma.constructionPhase.create({
    data: {
      projectId: symphonyResidence.id,
      name: "Interior Finishing & Turnkey Setup",
      description: "Interior fit-out, MEP systems, landscaping, and final handover preparation.",
      status: "pending",
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-08-31"),
      sortOrder: 4,
    },
  });

  await prisma.constructionMedia.createMany({
    data: [
      { phaseId: phase1.id, url: "/images/construction/sym-excavation-1.jpg", type: "image", caption: "Excavation in progress" },
      { phaseId: phase1.id, url: "/images/construction/sym-excavation-2.jpg", type: "image", caption: "Site cleared and graded" },
      { phaseId: phase2.id, url: "/images/construction/sym-foundation-1.jpg", type: "image", caption: "Foundation reinforcement" },
      { phaseId: phase2.id, url: "/images/construction/sym-foundation-2.jpg", type: "image", caption: "Underground parking taking shape" },
      { phaseId: phase3.id, url: "/images/construction/sym-structure-1.jpg", type: "image", caption: "Third floor slab poured" },
      { phaseId: phase3.id, url: "/videos/construction/sym-drone-march.mp4", type: "video", caption: "Drone flyover - March 2026" },
    ],
  });

  console.log("  Created 4 construction phases with media");

  // ── Payments ─────────────────────────────────────────────
  const symUnit = units.find((u) => u.code === "SYM-202")!;
  const acUnit = units.find((u) => u.code === "AC-201")!;

  await prisma.payment.createMany({
    data: [
      // buyer (Maria Petrova) — SYM-202: 3 paid + 1 overdue + 2 upcoming
      { userId: buyer.id, unitId: symUnit.id, description: "Booking Deposit", amount: 10000, dueDate: new Date("2025-09-15"), paidDate: new Date("2025-09-15"), status: "paid" },
      { userId: buyer.id, unitId: symUnit.id, description: "Contract Signing", amount: 35000, dueDate: new Date("2025-10-01"), paidDate: new Date("2025-10-02"), status: "paid" },
      { userId: buyer.id, unitId: symUnit.id, description: "Foundation Completion", amount: 30000, dueDate: new Date("2025-12-31"), paidDate: new Date("2025-12-28"), status: "paid" },
      { userId: buyer.id, unitId: symUnit.id, description: "Structural Milestone Advance", amount: 8000, dueDate: new Date("2026-01-15"), paidDate: null, status: "overdue" },
      { userId: buyer.id, unitId: symUnit.id, description: "Structural Completion", amount: 40000, dueDate: new Date("2026-04-15"), paidDate: null, status: "upcoming" },
      { userId: buyer.id, unitId: symUnit.id, description: "Interior Finishing", amount: 35000, dueDate: new Date("2026-07-01"), paidDate: null, status: "upcoming" },
      // buyer2 (Andreas Christodoulou) — AC-201: 2 paid + 1 overdue + 1 upcoming
      { userId: buyer2.id, unitId: acUnit.id, description: "Booking Deposit", amount: 8000, dueDate: new Date("2025-08-01"), paidDate: new Date("2025-08-01"), status: "paid" },
      { userId: buyer2.id, unitId: acUnit.id, description: "Contract Signing", amount: 28000, dueDate: new Date("2025-09-15"), paidDate: new Date("2025-09-14"), status: "paid" },
      { userId: buyer2.id, unitId: acUnit.id, description: "Foundation Milestone", amount: 22000, dueDate: new Date("2026-01-01"), paidDate: null, status: "overdue" },
      { userId: buyer2.id, unitId: acUnit.id, description: "Structural Completion", amount: 32000, dueDate: new Date("2026-06-01"), paidDate: null, status: "upcoming" },
    ],
  });

  console.log("  Created 10 payments (2 overdue, 5 paid, 3 upcoming)");

  // ── Documents (buyer) ────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { userId: buyer.id, name: "Purchase Agreement - SYM-202", category: "contract", fileUrl: "/docs/contracts/sym-202-agreement.pdf", fileSize: 2450000, status: "approved" },
      { userId: buyer.id, name: "Passport Copy", category: "passport", fileUrl: "/docs/identity/passport-petrova.pdf", fileSize: 850000, status: "approved" },
      { userId: buyer.id, name: "Tax Residency Certificate", category: "tax", fileUrl: "/docs/tax/tax-certificate-petrova.pdf", fileSize: 320000, status: "approved" },
      { userId: buyer.id, name: "Floor Plan - SYM-202", category: "floor_plan", fileUrl: "/docs/plans/sym-202-floorplan.pdf", fileSize: 1200000, status: "approved" },
      { userId: buyer.id, name: "Proof of Address", category: "tax", fileUrl: "/docs/tax/proof-of-address-petrova.pdf", fileSize: 450000, status: "pending" },
    ],
  });

  console.log("  Created 5 documents");

  // ── Leads (12) ───────────────────────────────────────────
  const lead1 = await prisma.lead.create({ data: { source: "quiz", status: "contacted", name: "Elena Karasova", email: "elena@example.com", data: '{"budget":"300k-500k","preference":"2bed","timeline":"6months"}', tag: "hot", agentId: agent.id } });
  await prisma.lead.create({ data: { source: "newsletter", status: "new", email: "john.smith@example.com", tag: "warm" } });
  const lead3 = await prisma.lead.create({ data: { source: "brochure", status: "contacted", name: "Ahmed Al-Hassan", email: "ahmed@example.com", phone: "+971 50 1234567", tag: "warm", agentId: agent.id } });
  await prisma.lead.create({ data: { source: "call_booking", status: "new", name: "Li Wei", email: "li.wei@example.com", phone: "+86 138 0000 1234", data: '{"preferredDate":"2026-03-15","project":"sungardo"}', tag: "hot" } });
  await prisma.lead.create({ data: { userId: investor.id, source: "quiz", status: "converted", name: "Alexander Chen", email: "investor@develta.cy", data: '{"investmentRange":"100k-500k","interest":"rental_yield"}', tag: "hot", agentId: agent.id } });
  await prisma.lead.create({ data: { source: "quiz", status: "contacted", name: "Dmitry Volkov", email: "dmitry@example.com", phone: "+357 99 123456", tag: "hot", agentId: agent.id, data: JSON.stringify({ timing: "1-3 months", budget: "€500k+" }) } });
  await prisma.lead.create({ data: { source: "quiz", status: "new", name: "Sophie Laurent", email: "sophie@example.com", tag: "warm" } });
  await prisma.lead.create({ data: { source: "newsletter", status: "lost", name: "Robert Mueller", email: "r.mueller@example.com", tag: "cold" } });
  const lead9 = await prisma.lead.create({ data: { source: "brochure", status: "converted", name: "Yuki Tanaka", phone: "+81 90 1234 5678", tag: "hot", agentId: agent.id } });
  await prisma.lead.create({ data: { source: "call_booking", status: "lost", name: "Marco Rossi", email: "marco@example.com", tag: "cold" } });
  const lead11 = await prisma.lead.create({ data: { source: "quiz", status: "converted", name: "Priya Sharma", email: "priya@example.com", tag: "hot", agentId: agent.id } });
  await prisma.lead.create({ data: { source: "newsletter", status: "new", email: "info@nordic-invest.dk", tag: "warm" } });

  console.log("  Created 12 leads (new: 4, contacted: 3, converted: 3, lost: 2)");

  // ── Lead Notes (3) ───────────────────────────────────────
  await prisma.leadNote.createMany({
    data: [
      { leadId: lead1.id, authorId: agent.id, content: "Called on 10 March. Interested in 2bed at Sungardo. Budget confirmed €300-400k." },
      { leadId: lead3.id, authorId: agent.id, content: "Visited office. Serious buyer, requesting floor plans." },
      { leadId: lead11.id, authorId: agent.id, content: "Converted — signed reservation for SYM-101." },
    ],
  });

  console.log("  Created 3 lead notes");

  // ── Commissions (2) ──────────────────────────────────────
  await prisma.commission.createMany({
    data: [
      { agentId: agent.id, amount: 8750, status: "approved", description: "SYM-101 sale commission 2.5%" },
      { agentId: agent.id, amount: 5600, status: "pending", description: "AC-201 reservation commission 2%" },
    ],
  });

  console.log("  Created 2 commissions");

  // ── Investment Pools (2) ──────────────────────────────────
  const auraPool = await prisma.investmentPool.create({
    data: {
      name: "Aura Residences Pool",
      projectName: "Aura Residences",
      goalAmount: 2500000,
      raisedAmount: 1850000,
      targetYield: 7.2,
      termMonths: 24,
      minTicket: 50000,
      status: "active",
      imageUrl: "/images/pools/aura-residences.jpg",
      description: "Co-investment pool for Aura Residences, a premium seafront development in Limassol Marina. 74% funded with strong investor demand.",
    },
  });
  const elysiumPool = await prisma.investmentPool.create({
    data: {
      name: "Elysium Villas Pool",
      projectName: "Elysium Villas",
      goalAmount: 1800000,
      raisedAmount: 450000,
      targetYield: 8.5,
      termMonths: 18,
      minTicket: 25000,
      status: "active",
      imageUrl: "/images/pools/elysium-villas.jpg",
      description: "Early-stage investment opportunity in Elysium Villas, a boutique villa complex in Germasogeia. High yield potential with 18-month term.",
    },
  });

  await prisma.investorInvestment.createMany({
    data: [
      { userId: investor.id, poolId: auraPool.id, amount: 100000 },
      { userId: investor.id, poolId: elysiumPool.id, amount: 50000 },
    ],
  });

  console.log("  Created 2 investment pools + 2 investor investments");

  // ── Job Positions (4) ────────────────────────────────────
  await prisma.jobPosition.createMany({
    data: [
      { title: "Senior Full-Stack Developer", slug: "senior-full-stack-developer", department: "Engineering", location: "Limassol, Cyprus", type: "full_time", description: "<h3>About the Role</h3><p>We are looking for an experienced full-stack developer to build and maintain our property technology platform.</p>", isActive: true },
      { title: "Real Estate Sales Manager", slug: "real-estate-sales-manager", department: "Sales", location: "Limassol, Cyprus", type: "full_time", description: "<h3>About the Role</h3><p>Lead our sales team in promoting luxury residential projects across Limassol.</p>", isActive: true },
      { title: "Marketing Specialist", slug: "marketing-specialist", department: "Marketing", location: "Limassol, Cyprus", type: "full_time", description: "<h3>About the Role</h3><p>Drive digital marketing campaigns for our real estate portfolio.</p>", isActive: true },
      { title: "Construction Project Coordinator", slug: "construction-project-coordinator", department: "Operations", location: "Limassol, Cyprus", type: "contract", description: "<h3>About the Role</h3><p>Coordinate construction timelines and liaise with contractors.</p>", isActive: true },
    ],
  });

  console.log("  Created 4 job positions");

  // ── FAQ (6) ───────────────────────────────────────────────
  await prisma.fAQ.createMany({
    data: [
      { question: "What is the process for purchasing property in Cyprus as a foreign buyer?", answer: "Foreign buyers can purchase property in Cyprus with minimal restrictions. The process includes selecting a property, signing a reservation agreement, conducting due diligence, signing the sale contract at the Land Registry, and obtaining Council of Ministers approval (for non-EU citizens).", sortOrder: 1, category: "Buying Process" },
      { question: "What are the typical payment terms for off-plan properties?", answer: "Payment is usually structured in installments tied to construction milestones: a booking deposit (5-10%), contract signing (20-30%), foundation completion (15-20%), structural completion (20-25%), and final payment on handover (15-20%).", sortOrder: 2, category: "Buying Process" },
      { question: "Can I earn rental income from my investment property?", answer: "Yes. Limassol has strong rental demand driven by the tech sector and tourism. Typical net yields range from 4-7% depending on property type and location.", sortOrder: 3, category: "Investment" },
      { question: "What tax benefits are available for property investors in Cyprus?", answer: "Cyprus offers attractive tax incentives including no property tax (abolished in 2017), reduced VAT at 5% for primary residences, no inheritance tax, and favorable capital gains treatment.", sortOrder: 4, category: "Investment" },
      { question: "How long does the title deed transfer process take?", answer: "The title deed transfer typically takes 2-4 weeks after all payments are settled.", sortOrder: 5, category: "Legal & Tax" },
      { question: "Do I need a local bank account to buy property in Cyprus?", answer: "It is advisable to open a Cyprus bank account to facilitate property transactions. International wire transfers are accepted.", sortOrder: 6, category: "Legal & Tax" },
    ],
  });

  console.log("  Created 6 FAQ entries");

  // ── Articles (3) ─────────────────────────────────────────
  await prisma.article.createMany({
    data: [
      { title: "Why Limassol Is the Mediterranean's Hottest Property Market in 2026", slug: "limassol-hottest-property-market-2026", category: "Market Insights", excerpt: "Discover why international investors are flocking to Limassol and what makes this coastal city a prime real estate destination.", content: "<p>Limassol has emerged as one of the Mediterranean's most dynamic property markets, attracting investors from across Europe, the Middle East, and Asia.</p>", imageUrl: "/images/articles/limassol-market-2026.jpg" },
      { title: "A Complete Guide to Off-Plan Property Investment in Cyprus", slug: "guide-off-plan-property-investment-cyprus", category: "Investment Guide", excerpt: "Everything you need to know about buying off-plan in Cyprus, from legal requirements to payment structures.", content: "<p>Off-plan property purchases represent one of the most attractive investment strategies in Cyprus real estate.</p>", imageUrl: "/images/articles/off-plan-guide.jpg" },
      { title: "Construction Update: Symphony Residence Reaches New Milestone", slug: "symphony-residence-construction-update-march-2026", category: "Project Updates", excerpt: "Our flagship Symphony Residence project is progressing on schedule with the superstructure framework nearing completion.", content: "<p>We are pleased to share that Symphony Residence has reached a significant construction milestone.</p>", imageUrl: "/images/articles/symphony-update-march.jpg" },
    ],
  });

  console.log("  Created 3 articles");

  console.log("\n✓ Seeding complete!");
  console.log("  Test accounts (password: develta123):");
  console.log("    admin@develta.cy   — internal_team");
  console.log("    buyer@develta.cy   — buyer (unit SYM-202)");
  console.log("    buyer2@develta.cy  — buyer (unit AC-201)");
  console.log("    investor@develta.cy — investor");
  console.log("    agent@develta.cy   — agent");
  console.log("    team@develta.cy    — internal_team");

  void admin;
  void lead9;
  void phase4;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
