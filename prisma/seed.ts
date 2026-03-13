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
      location: "Mouttagiaka, Limassol",
      description: "Contemporary low-rise residential complex in Mouttagiaka, 150m from the Mediterranean. 4 floors, 950 m² covered area. Apartments from 83 m² (2-bed) to 115 m² (3-bed), each with covered veranda, storage, and parking. 150m to beach · 750m Columbia Beach Restaurant · 700m Alfamega.",
      imageUrl: "/images/projects/sungardo.jpeg",
      status: "active",
    },
  });

  const antigoneCourt = await prisma.project.create({
    data: {
      name: "Antigone Court",
      slug: "antigone-court",
      location: "Limassol",
      description: "A new Develta Group residential development in Limassol. Thoughtfully designed apartments in a prime location. Register your interest for priority access and project updates.",
      imageUrl: "/images/projects/antigone-court.jpeg",
      status: "active",
    },
  });

  const symphonyResidence = await prisma.project.create({
    data: {
      name: "Symphony Residence",
      slug: "symphony-residence",
      location: "Tourist Area, Limassol",
      description: "Our flagship development in Limassol's prestigious tourist area. A harmonious blend of contemporary design and Mediterranean character, with structured milestone-based payment plans.",
      imageUrl: "/images/projects/symphony-residence.jpeg",
      status: "active",
    },
  });

  const cascadaResidence = await prisma.project.create({
    data: {
      name: "Cascada Residence",
      slug: "cascada-residence",
      location: "Mouttagiaka, Limassol",
      description: "Coastal living redefined in Mouttagiaka. A limited collection of apartments and penthouses with panoramic sea views and contemporary interiors in a prime beachside setting.",
      imageUrl: "/images/projects/cascada-residence.jpeg",
      status: "coming_soon",
    },
  });

  const ptolemyStudios = await prisma.project.create({
    data: {
      name: "Ptolemy Studios",
      slug: "ptolemy-studios",
      location: "Limassol",
      description: "A completed boutique collection of studios and one-bedroom apartments in central Limassol. Ptolemy Studios was fully sold prior to handover — demonstrating Develta Group's delivery track record.",
      imageUrl: "/images/projects/ptolemy-studios.jpeg",
      status: "completed",
    },
  });

  console.log("  Created 5 projects");

  // ── Units (22) ───────────────────────────────────────────
  const units = await Promise.all([
    // Sungardo — real floor plans from develta.cy
    // Floor 1: units 101 (2bed, 83.4m²) and 102 (3bed, 114.8m²)
    // Floor 2: unit 202 (3bed, 114.8m²) confirmed; 201 estimated
    // Floors 3-4: estimated based on building layout
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-101", type: "2bed", bedrooms: 2, floor: 1, areaSqm: 83, price: 430000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-102", type: "3bed", bedrooms: 3, floor: 1, areaSqm: 115, price: 590000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-201", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 83, price: 445000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-202", type: "3bed", bedrooms: 3, floor: 2, areaSqm: 115, price: 610000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-PH1", type: "penthouse", bedrooms: 3, floor: 4, areaSqm: 145, price: 920000, status: "available" } }),

    // Antigone Court — 5 units (AC-201 now sold, linked to buyer2)
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 42, price: 160000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-102", type: "1bed", bedrooms: 1, floor: 1, areaSqm: 58, price: 225000, status: "available" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-201", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 88, price: 365000, status: "sold", buyerId: buyer2.id } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 120, price: 480000, status: "available" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-PH1", type: "penthouse", bedrooms: 3, floor: 4, areaSqm: 165, price: 820000, status: "available" } }),

    // Symphony Residence — 5 units (SYM-202 linked to buyer)
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 48, price: 190000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 68, price: 310000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-202", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 92, price: 450000, status: "reserved", buyerId: buyer.id } }),
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
      {
        title: "Senior Full-Stack Developer",
        slug: "senior-full-stack-developer",
        department: "Engineering",
        location: "Limassol, Cyprus",
        type: "full_time",
        isActive: true,
        description: `<h3>About the Role</h3>
<p>We are looking for an experienced full-stack developer to build and maintain Develta's property technology platform — the digital backbone that connects our developers, buyers, investors, and agents. You'll be working on a modern SvelteKit codebase with a focus on clean architecture, real-time data, and an exceptional user experience.</p>
<h3>What You'll Do</h3>
<ul>
  <li>Build and extend our buyer, investor, agent, and admin portal features</li>
  <li>Design and implement backend APIs and database schemas (Prisma + SQLite/PostgreSQL)</li>
  <li>Integrate third-party services: payments, document storage, email, and AI features</li>
  <li>Own end-to-end delivery of features from spec to production</li>
  <li>Participate in architecture decisions and code reviews</li>
</ul>
<h3>What We're Looking For</h3>
<ul>
  <li>5+ years of full-stack web development experience</li>
  <li>Strong TypeScript skills; experience with SvelteKit or similar SSR frameworks</li>
  <li>Comfortable with SQL and ORM tooling (Prisma, Drizzle, or similar)</li>
  <li>Experience shipping production-grade applications</li>
  <li>Fluent in English; Russian or Greek is a bonus</li>
</ul>`,
      },
      {
        title: "Real Estate Sales Manager",
        slug: "real-estate-sales-manager",
        department: "Sales",
        location: "Limassol, Cyprus",
        type: "full_time",
        isActive: true,
        description: `<h3>About the Role</h3>
<p>Join Develta Group as a Sales Manager and take ownership of residential sales across our premium Limassol developments. You'll be working with an international client base — from local Cypriot buyers to investors from the Middle East, Eastern Europe, and Asia — guiding them through the purchase process from first inquiry to signed contract.</p>
<h3>What You'll Do</h3>
<ul>
  <li>Manage the full sales cycle for off-plan and completed residential units</li>
  <li>Build and maintain relationships with buyers, agents, and referral networks</li>
  <li>Conduct property presentations and site visits</li>
  <li>Use our digital CRM platform to track leads and manage your pipeline</li>
  <li>Work with the legal and finance teams to facilitate smooth transactions</li>
</ul>
<h3>What We're Looking For</h3>
<ul>
  <li>3+ years of real estate sales experience, preferably in Cyprus or the wider Mediterranean market</li>
  <li>Strong track record of closing premium residential deals</li>
  <li>Excellent communication skills in English; Russian or Arabic is a significant advantage</li>
  <li>Real Estate Agent licence (Cyprus CREAA) or willingness to obtain one</li>
</ul>`,
      },
      {
        title: "Marketing Specialist",
        slug: "marketing-specialist",
        department: "Marketing",
        location: "Limassol, Cyprus",
        type: "full_time",
        isActive: true,
        description: `<h3>About the Role</h3>
<p>We are looking for a creative and data-driven Marketing Specialist to grow Develta's digital presence and drive qualified leads to our sales team. You'll manage campaigns across social media, search, and content channels, building awareness of our brand and our projects in key target markets.</p>
<h3>What You'll Do</h3>
<ul>
  <li>Plan and execute paid campaigns on Meta, Google, and LinkedIn targeting international property investors</li>
  <li>Create and manage content for Instagram (@develta.cy), LinkedIn, and Facebook</li>
  <li>Write and edit website copy, blog articles, and email campaigns</li>
  <li>Manage lead generation funnels and coordinate with the sales team on lead quality</li>
  <li>Analyse campaign performance and report on key metrics</li>
</ul>
<h3>What We're Looking For</h3>
<ul>
  <li>2+ years of digital marketing experience, ideally in real estate, luxury goods, or B2C high-ticket sales</li>
  <li>Hands-on experience with Meta Ads Manager and Google Ads</li>
  <li>Strong copywriting skills in English; Russian is a strong plus</li>
  <li>Comfortable working with analytics tools and producing performance reports</li>
</ul>`,
      },
      {
        title: "Construction Project Coordinator",
        slug: "construction-project-coordinator",
        department: "Operations",
        location: "Limassol, Cyprus",
        type: "contract",
        isActive: true,
        description: `<h3>About the Role</h3>
<p>We are seeking an experienced Construction Project Coordinator to oversee day-to-day coordination across our active development sites in Limassol. You will be the link between our project management office, contractors, architects, and client-facing teams, ensuring that construction milestones are delivered on time and to specification.</p>
<h3>What You'll Do</h3>
<ul>
  <li>Monitor construction progress against schedule on active sites (currently Symphony Residence and Sungardo)</li>
  <li>Liaise with general contractors, subcontractors, and the supervising engineer</li>
  <li>Document milestone completions for client portal updates and payment triggers</li>
  <li>Identify and escalate schedule risks and quality issues</li>
  <li>Coordinate delivery of inspection reports and construction photography</li>
</ul>
<h3>What We're Looking For</h3>
<ul>
  <li>3+ years of construction coordination or site management experience in Cyprus or Greece</li>
  <li>Familiarity with residential construction processes and Cypriot building regulations</li>
  <li>Strong organisational and communication skills</li>
  <li>Fluent in Greek and English</li>
  <li>Civil engineering or architecture background preferred</li>
</ul>`,
      },
    ],
  });

  console.log("  Created 4 job positions");

  // ── FAQ (5) — from develta.cy ─────────────────────────────
  await prisma.fAQ.createMany({
    data: [
      { question: "What is the expected ROI on Develta projects?", answer: "Our projects typically target a net rental yield of 6–8% per annum, supported by Limassol's strong tourism-driven rental demand. Capital appreciation has historically averaged 5–10% annually in prime Limassol locations.", sortOrder: 1, category: "Investment" },
      { question: "Can purchasing a property help me obtain Cyprus residency?", answer: "Yes. Investing a minimum of €300,000 in new residential property in Cyprus qualifies you for the Cyprus Permanent Residency programme (Category F). Develta's legal team can guide you through the full application process.", sortOrder: 2, category: "Residency" },
      { question: "What is the minimum investment amount?", answer: "Our studio apartments start from approximately €150,000. The minimum qualifying investment for Cyprus Permanent Residency is €300,000 (VAT included). Investment pool participation is available from €25,000.", sortOrder: 3, category: "Investment" },
      { question: "What tax benefits does Cyprus offer property investors?", answer: "Cyprus offers some of Europe's most attractive property investment conditions: no annual property tax (abolished 2017), 5% VAT on your first residential property, no inheritance tax, and a flat 12.5% corporate tax rate — one of the lowest in the EU.", sortOrder: 4, category: "Legal & Tax" },
      { question: "Are there residency or citizenship programmes available?", answer: "Cyprus offers a Permanent Residency programme for non-EU investors who purchase property worth €300,000 or more. Fast-track processing is available. Note: the Cyprus Investment Programme (citizenship by investment) was suspended in November 2020; Permanent Residency remains the primary route for property investors.", sortOrder: 5, category: "Residency" },
    ],
  });

  console.log("  Created 5 FAQ entries");

  // ── Articles (3) ─────────────────────────────────────────
  const article1Content = `
<p>Limassol has emerged as one of the Mediterranean's most dynamic property markets, attracting investors from across Europe, the Middle East, and Asia. With a combination of strategic EU membership benefits, a booming tech and financial services sector, and year-round sunshine, the city has fundamentally transformed from a regional port into an international investment destination.</p>

<h3>What's driving demand in 2026</h3>
<p>The influx of tech companies and their employees into Limassol's central business district has created sustained rental demand that shows no sign of slowing. Major corporations have established regional headquarters here, bringing with them a well-paid workforce that requires quality housing. This has pushed vacancy rates in prime areas to below 4% — an exceptionally tight market.</p>
<p>At the same time, Limassol's tourism sector hit record visitor numbers in 2025. Tourists drawn by the marina, the old city, and the coastline between Mouttagiaka and Amathus are fuelling short-term rental demand. Investors who purchased properties in 2022–2023 are now reporting average yields of 6.5–8.5% on well-located apartments.</p>

<h3>The residency advantage</h3>
<p>Cyprus's Permanent Residency programme — offering non-EU nationals a path to EU residency through property investment of €300,000 or more — remains one of Europe's most accessible. This has drawn buyers from Russia, Israel, Lebanon, China, and the UAE who want both a quality property asset and a European foothold.</p>

<h3>Infrastructure and liveability</h3>
<p>Limassol consistently ranks among the safest cities in Europe, with excellent international schooling, a growing private healthcare sector, and a climate that offers over 300 days of sunshine per year. For buyers seeking a second home or relocation destination, these factors are as important as the financial returns.</p>

<h3>Where to invest</h3>
<p>The seafront corridor from the Old Port to Limassol Marina commands the highest prices and strongest yields. The Mouttagiaka coastal strip — where our Sungardo and Cascada Residence projects are located — offers excellent value with direct beach access and strong rental potential from both short and long-term tenants. The tourist area near the Four Seasons remains consistently popular for mid-to-high-end apartments.</p>
<p>For investors looking at the broader market, Germasogeia and Agios Athanasios offer emerging opportunities at lower entry points, while still benefiting from Limassol's overall growth trajectory.</p>
`.trim();

  const article2Content = `
<p>Off-plan property purchases — buying a property before it is built, based on architectural plans and specifications — are one of the most effective ways to invest in Cyprus real estate. When executed with the right developer, you lock in today's price for tomorrow's asset, often with a significant capital appreciation by the time the keys are handed over.</p>

<h3>Why buy off-plan?</h3>
<p>The primary advantage is price. Off-plan properties are typically sold at 10–20% below their post-completion market value, as the developer needs to raise construction capital and rewards early buyers for taking on development risk. In Limassol's appreciating market, buyers who entered at launch prices have consistently seen strong capital gains by handover.</p>
<p>The second advantage is flexibility in payment. Unlike a completed property purchase, off-plan deals are structured in milestones tied to construction progress, spreading your capital commitment over 18–36 months. This allows investors to deploy capital gradually while the asset appreciates.</p>

<h3>Understanding the payment structure</h3>
<p>A typical Develta payment schedule looks like this:</p>
<ul>
  <li><strong>Booking deposit (5–10%):</strong> Reserves your unit and removes it from sale</li>
  <li><strong>Contract signing (20–30%):</strong> Paid within 30 days of signing the SPA at the Land Registry</li>
  <li><strong>Foundation completion (15–20%):</strong> On verified completion of substructure works</li>
  <li><strong>Structural completion (20–25%):</strong> When the building frame is complete</li>
  <li><strong>Handover (15–20%):</strong> Final payment on key delivery</li>
</ul>
<p>Each milestone payment is tied to independently verifiable construction progress, giving buyers full transparency and contractual protection.</p>

<h3>Legal protections for buyers</h3>
<p>Cyprus has a well-developed legal framework for property purchases. The Sale of Property (Specific Performance) Law requires that purchase contracts be deposited at the Land Registry, which protects the buyer's title claim even if the developer has a mortgage on the land. All Develta contracts are deposited at the Land Registry as standard.</p>
<p>For non-EU buyers, a Council of Ministers approval is required to purchase property — this is a straightforward administrative process that our legal team handles on your behalf.</p>

<h3>Due diligence checklist</h3>
<ul>
  <li>Verify the developer's track record and completed projects</li>
  <li>Review the building permit and architectural approvals</li>
  <li>Confirm title deed status of the land (should be free of encumbrances)</li>
  <li>Check VAT status: 5% reduced VAT applies to primary residences; 19% to investment properties</li>
  <li>Engage an independent Cyprus-qualified lawyer (separate from the developer's legal team)</li>
</ul>

<h3>The Develta approach</h3>
<p>We provide all buyers with a dedicated client portal from day one. This gives you real-time access to construction photo updates, payment schedules, document storage, and direct communication with our team. Our goal is to make off-plan investment as transparent and stress-free as a completed property purchase.</p>
`.trim();

  const article3Content = `
<p>We are pleased to report that Symphony Residence — our flagship development in Limassol's tourist area — has successfully completed the superstructure framework phase and is progressing on schedule for Q3 2026 delivery.</p>

<h3>What has been completed</h3>
<p>The first two construction phases are now fully signed off: site preparation and excavation (October 2025) and foundation and substructure works (November–December 2025). The third phase — superstructure framework, including all floor slabs, columns, and exterior walls — reached completion in late February 2026, one week ahead of the planned schedule.</p>
<p>Our buyers with units in Symphony Residence can view photo documentation and a drone flyover video from March 2026 in their cabinet portal under the Construction section.</p>

<h3>What comes next</h3>
<p>Phase 4, interior finishing and turnkey setup, runs from April through August 2026. This phase covers:</p>
<ul>
  <li>MEP (mechanical, electrical, plumbing) rough-in and fit-out</li>
  <li>Floor and wall finishes throughout all units</li>
  <li>Kitchen and bathroom installations to specification</li>
  <li>Landscaping and common area completion</li>
  <li>Final building inspections and certificate of occupancy</li>
</ul>

<h3>Payment milestones</h3>
<p>For buyers whose payment schedules reference the structural completion milestone, invoices will be issued in March 2026 in accordance with your individual purchase agreements. Our finance team will contact all affected buyers directly with payment instructions.</p>

<h3>A note on quality</h3>
<p>Symphony Residence uses reinforced concrete frame construction with AAC block infill — the same proven system used in our completed Ptolemy Studios project, which was handed over to buyers fully on time and within budget. All structural works are supervised by our appointed independent engineer and inspected at each milestone before payment triggers are activated.</p>
<p>If you have any questions about your unit or the construction timeline, please contact your dedicated client manager through the portal or reach our team at sales@develta.cy.</p>
`.trim();

  await prisma.article.createMany({
    data: [
      {
        title: "Why Limassol Is the Mediterranean's Hottest Property Market in 2026",
        slug: "limassol-hottest-property-market-2026",
        category: "Market Insights",
        excerpt: "Discover why international investors are flocking to Limassol and what makes this coastal city a prime real estate destination.",
        content: article1Content,
        imageUrl: "/images/scraped/about-us.jpeg",
      },
      {
        title: "A Complete Guide to Off-Plan Property Investment in Cyprus",
        slug: "guide-off-plan-property-investment-cyprus",
        category: "Investment Guide",
        excerpt: "Everything you need to know about buying off-plan in Cyprus, from legal requirements to payment structures.",
        content: article2Content,
        imageUrl: "/images/scraped/sungardo.jpeg",
      },
      {
        title: "Construction Update: Symphony Residence Reaches New Milestone",
        slug: "symphony-residence-construction-update-march-2026",
        category: "Project Updates",
        excerpt: "Our flagship Symphony Residence project is progressing on schedule with the superstructure framework nearing completion.",
        content: article3Content,
        imageUrl: "/images/projects/symphony-residence.jpeg",
      },
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
