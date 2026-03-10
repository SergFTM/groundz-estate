import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.investorInvestment.deleteMany();
  await prisma.constructionMedia.deleteMany();
  await prisma.constructionPhase.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.project.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.investmentPool.deleteMany();
  await prisma.article.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 12);

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@develta.cy",
      password: hashedPassword,
      role: "buyer",
      name: "Maria Petrova",
      phone: "+357 96 123456",
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

  const admin = await prisma.user.create({
    data: {
      email: "admin@develta.cy",
      password: hashedPassword,
      role: "internal_team",
      name: "Sarah Admin",
      phone: "+357 96 456789",
    },
  });

  console.log("  Created 4 users");

  // ── Projects ───────────────────────────────────────────
  const sungardo = await prisma.project.create({
    data: {
      name: "Sungardo",
      slug: "sungardo",
      location: "Limassol Marina",
      description: "A premium waterfront development offering luxury living with stunning marina views.",
      imageUrl: "/images/projects/sungardo.jpg",
      status: "active",
    },
  });

  const antigoneCourt = await prisma.project.create({
    data: {
      name: "Antigone Court",
      slug: "antigone-court",
      location: "Germasogeia",
      description: "Modern residential complex in the heart of Germasogeia with easy access to the beach.",
      imageUrl: "/images/projects/antigone-court.jpg",
      status: "active",
    },
  });

  const symphonyResidence = await prisma.project.create({
    data: {
      name: "Symphony Residence",
      slug: "symphony-residence",
      location: "Tourist Area, Limassol",
      description: "Elegant apartments in Limassol's sought-after tourist area, minutes from the sea.",
      imageUrl: "/images/projects/symphony-residence.jpg",
      status: "active",
    },
  });

  const cascadaResidence = await prisma.project.create({
    data: {
      name: "Cascada Residence",
      slug: "cascada-residence",
      location: "Mouttagiaka",
      description: "Upcoming coastal development with panoramic sea views and contemporary design.",
      imageUrl: "/images/projects/cascada-residence.jpg",
      status: "coming_soon",
    },
  });

  const ptolemyStudios = await prisma.project.create({
    data: {
      name: "Ptolemy Studios",
      slug: "ptolemy-studios",
      location: "Historical Center",
      description: "Boutique studio apartments in Limassol's charming historical center.",
      imageUrl: "/images/projects/ptolemy-studios.jpg",
      status: "completed",
    },
  });

  console.log("  Created 5 projects");

  // ── Units ──────────────────────────────────────────────
  const units = await Promise.all([
    // Sungardo - 5 units
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 45, price: 175000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 65, price: 280000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-202", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 95, price: 420000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 130, price: 580000, status: "available" } }),
    prisma.unit.create({ data: { projectId: sungardo.id, code: "SUN-PH1", type: "penthouse", bedrooms: 3, floor: 5, areaSqm: 180, price: 950000, status: "available" } }),

    // Antigone Court - 5 units
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 42, price: 160000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-102", type: "1bed", bedrooms: 1, floor: 1, areaSqm: 58, price: 225000, status: "available" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-201", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 88, price: 365000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 120, price: 480000, status: "available" } }),
    prisma.unit.create({ data: { projectId: antigoneCourt.id, code: "AC-PH1", type: "penthouse", bedrooms: 3, floor: 4, areaSqm: 165, price: 820000, status: "available" } }),

    // Symphony Residence - 5 units
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 48, price: 190000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 68, price: 310000, status: "reserved" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-202", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 92, price: 450000, status: "available" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-301", type: "3bed", bedrooms: 3, floor: 3, areaSqm: 135, price: 620000, status: "available" } }),
    prisma.unit.create({ data: { projectId: symphonyResidence.id, code: "SYM-PH1", type: "penthouse", bedrooms: 4, floor: 6, areaSqm: 200, price: 1150000, status: "available" } }),

    // Cascada Residence - 3 units
    prisma.unit.create({ data: { projectId: cascadaResidence.id, code: "CAS-101", type: "1bed", bedrooms: 1, floor: 1, areaSqm: 62, price: 260000, status: "available" } }),
    prisma.unit.create({ data: { projectId: cascadaResidence.id, code: "CAS-201", type: "2bed", bedrooms: 2, floor: 2, areaSqm: 98, price: 480000, status: "available" } }),
    prisma.unit.create({ data: { projectId: cascadaResidence.id, code: "CAS-PH1", type: "penthouse", bedrooms: 3, floor: 4, areaSqm: 175, price: 890000, status: "available" } }),

    // Ptolemy Studios - 4 units
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-101", type: "studio", bedrooms: 0, floor: 1, areaSqm: 38, price: 155000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-102", type: "studio", bedrooms: 0, floor: 1, areaSqm: 40, price: 162000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-201", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 55, price: 220000, status: "sold" } }),
    prisma.unit.create({ data: { projectId: ptolemyStudios.id, code: "PT-202", type: "1bed", bedrooms: 1, floor: 2, areaSqm: 60, price: 245000, status: "sold" } }),
  ]);

  console.log(`  Created ${units.length} units`);

  // ── Link buyer to a unit ─────────────────────────────────
  const symUnitBuyer = units.find((u) => u.code === "SYM-202")!;
  await prisma.unit.update({
    where: { id: symUnitBuyer.id },
    data: { buyerId: buyer.id },
  });
  console.log("  Linked buyer to unit SYM-202");

  // ── Construction Phases (Symphony Residence) ───────────
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

  // Construction media for phases
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

  console.log("  Created 4 construction phases with 6 media items");

  // ── Payments (buyer, Symphony Residence unit SYM-202) ──
  // Find the SYM-202 unit
  const symUnit = units.find((u) => u.code === "SYM-202")!;

  await prisma.payment.createMany({
    data: [
      {
        userId: buyer.id,
        unitId: symUnit.id,
        description: "Booking Deposit",
        amount: 10000,
        dueDate: new Date("2025-09-15"),
        paidDate: new Date("2025-09-15"),
        status: "paid",
      },
      {
        userId: buyer.id,
        unitId: symUnit.id,
        description: "Contract Signing",
        amount: 35000,
        dueDate: new Date("2025-10-01"),
        paidDate: new Date("2025-10-02"),
        status: "paid",
      },
      {
        userId: buyer.id,
        unitId: symUnit.id,
        description: "Foundation Completion",
        amount: 30000,
        dueDate: new Date("2025-12-31"),
        paidDate: new Date("2025-12-28"),
        status: "paid",
      },
      {
        userId: buyer.id,
        unitId: symUnit.id,
        description: "Structural Completion",
        amount: 40000,
        dueDate: new Date("2026-04-15"),
        paidDate: null,
        status: "upcoming",
      },
      {
        userId: buyer.id,
        unitId: symUnit.id,
        description: "Interior Finishing",
        amount: 35000,
        dueDate: new Date("2026-07-01"),
        paidDate: null,
        status: "upcoming",
      },
      {
        userId: buyer.id,
        unitId: symUnit.id,
        description: "Final Payment & Keys",
        amount: 35000,
        dueDate: new Date("2026-09-01"),
        paidDate: null,
        status: "upcoming",
      },
    ],
  });

  console.log("  Created 6 payments");

  // ── Documents (buyer) ──────────────────────────────────
  await prisma.document.createMany({
    data: [
      {
        userId: buyer.id,
        name: "Purchase Agreement - SYM-202",
        category: "contract",
        fileUrl: "/docs/contracts/sym-202-agreement.pdf",
        fileSize: 2450000,
        status: "approved",
      },
      {
        userId: buyer.id,
        name: "Passport Copy",
        category: "passport",
        fileUrl: "/docs/identity/passport-petrova.pdf",
        fileSize: 850000,
        status: "approved",
      },
      {
        userId: buyer.id,
        name: "Tax Residency Certificate",
        category: "tax",
        fileUrl: "/docs/tax/tax-certificate-petrova.pdf",
        fileSize: 320000,
        status: "approved",
      },
      {
        userId: buyer.id,
        name: "Floor Plan - SYM-202",
        category: "floor_plan",
        fileUrl: "/docs/plans/sym-202-floorplan.pdf",
        fileSize: 1200000,
        status: "approved",
      },
      {
        userId: buyer.id,
        name: "Proof of Address",
        category: "tax",
        fileUrl: "/docs/tax/proof-of-address-petrova.pdf",
        fileSize: 450000,
        status: "pending",
      },
    ],
  });

  console.log("  Created 5 documents");

  // ── Leads ──────────────────────────────────────────────
  await prisma.lead.create({
    data: { source: "quiz", status: "contacted", name: "Elena Karasova", email: "elena@example.com", data: '{"budget":"300k-500k","preference":"2bed","timeline":"6months"}', tag: "hot", agentId: agent.id },
  });
  await prisma.lead.create({
    data: { source: "newsletter", status: "new", email: "john.smith@example.com", tag: "warm" },
  });
  await prisma.lead.create({
    data: { source: "brochure", status: "contacted", name: "Ahmed Al-Hassan", email: "ahmed@example.com", phone: "+971 50 1234567", tag: "warm", agentId: agent.id },
  });
  await prisma.lead.create({
    data: { source: "call_booking", status: "new", name: "Li Wei", email: "li.wei@example.com", phone: "+86 138 0000 1234", data: '{"preferredDate":"2026-03-15","project":"sungardo"}', tag: "hot" },
  });
  await prisma.lead.create({
    data: { userId: investor.id, source: "quiz", status: "converted", name: "Alexander Chen", email: "investor@develta.cy", data: '{"investmentRange":"100k-500k","interest":"rental_yield"}', tag: "hot", agentId: agent.id },
  });
  await prisma.lead.create({
    data: { source: "quiz", status: "contacted", name: "Dmitry Volkov", email: "dmitry@example.com", phone: "+357 99 123456", tag: "hot", agentId: agent.id, data: JSON.stringify({ timing: "1-3 months", budget: "€500k+" }) },
  });

  console.log("  Created 6 leads");

  // ── Investment Pools ───────────────────────────────────
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
    },
  });

  console.log("  Created 2 investment pools");

  // ── Investor Investments ─────────────────────────────────
  await prisma.investorInvestment.create({
    data: { userId: investor.id, poolId: auraPool.id, amount: 100000 },
  });
  await prisma.investorInvestment.create({
    data: { userId: investor.id, poolId: elysiumPool.id, amount: 50000 },
  });

  console.log("  Created 2 investor investments");

  // ── Job Positions ──────────────────────────────────────
  await prisma.jobPosition.createMany({
    data: [
      {
        title: "Senior Full-Stack Developer",
        department: "Engineering",
        location: "Limassol, Cyprus",
        type: "full_time",
        description: "We are looking for an experienced full-stack developer to build and maintain our property technology platform. You will work with SvelteKit, TypeScript, and Prisma to deliver features for buyers, investors, and agents.",
        isActive: true,
      },
      {
        title: "Real Estate Sales Manager",
        department: "Sales",
        location: "Limassol, Cyprus",
        type: "full_time",
        description: "Lead our sales team in promoting luxury residential projects across Limassol. You will manage client relationships, conduct property viewings, and close deals for off-plan and ready properties.",
        isActive: true,
      },
      {
        title: "Marketing Specialist",
        department: "Marketing",
        location: "Limassol, Cyprus",
        type: "full_time",
        description: "Drive digital marketing campaigns for our real estate portfolio. Experience with property marketing, social media advertising, and lead generation in the Cyprus market is highly valued.",
        isActive: true,
      },
      {
        title: "Construction Project Coordinator",
        department: "Operations",
        location: "Limassol, Cyprus",
        type: "contract",
        description: "Coordinate construction timelines, liaise with contractors, and ensure quality standards are met across our active development projects. Report progress to stakeholders and update our digital tracking systems.",
        isActive: true,
      },
    ],
  });

  console.log("  Created 4 job positions");

  // ── FAQ ────────────────────────────────────────────────
  await prisma.fAQ.createMany({
    data: [
      {
        question: "What is the process for purchasing property in Cyprus as a foreign buyer?",
        answer: "Foreign buyers can purchase property in Cyprus with minimal restrictions. The process includes selecting a property, signing a reservation agreement, conducting due diligence, signing the sale contract at the Land Registry, and obtaining Council of Ministers approval (for non-EU citizens). We guide you through every step.",
        sortOrder: 1,
      },
      {
        question: "What are the typical payment terms for off-plan properties?",
        answer: "Payment is usually structured in installments tied to construction milestones: a booking deposit (5-10%), contract signing (20-30%), foundation completion (15-20%), structural completion (20-25%), and final payment on handover (15-20%). Exact terms vary by project.",
        sortOrder: 2,
      },
      {
        question: "Can I earn rental income from my investment property?",
        answer: "Yes. Limassol has strong rental demand driven by the tech sector and tourism. We offer rental management services and can connect you with our partner agencies. Typical net yields range from 4-7% depending on property type and location.",
        sortOrder: 3,
      },
      {
        question: "What tax benefits are available for property investors in Cyprus?",
        answer: "Cyprus offers attractive tax incentives including no property tax (abolished in 2017), reduced VAT at 5% for primary residences, no inheritance tax, and favorable capital gains treatment. We recommend consulting with a local tax advisor for your specific situation.",
        sortOrder: 4,
      },
    ],
  });

  console.log("  Created 4 FAQ entries");

  // ── Articles ───────────────────────────────────────────
  await prisma.article.createMany({
    data: [
      {
        title: "Why Limassol Is the Mediterranean's Hottest Property Market in 2026",
        slug: "limassol-hottest-property-market-2026",
        category: "Market Insights",
        excerpt: "Discover why international investors are flocking to Limassol and what makes this coastal city a prime real estate destination.",
        content: "Limassol has emerged as one of the Mediterranean's most dynamic property markets, attracting investors from across Europe, the Middle East, and Asia. The city's transformation over the past decade has been remarkable, with world-class infrastructure, a thriving tech ecosystem, and an enviable lifestyle drawing high-net-worth individuals.\n\nKey factors driving demand include the Cyprus Investment Programme legacy, a favorable tax environment, EU membership benefits, and a growing expatriate community. Property prices have seen consistent year-over-year growth of 8-12%, with prime seafront locations commanding premium valuations.\n\nFor investors seeking a combination of capital appreciation and rental yield, Limassol offers a compelling proposition that few Mediterranean cities can match.",
        imageUrl: "/images/articles/limassol-market-2026.jpg",
      },
      {
        title: "A Complete Guide to Off-Plan Property Investment in Cyprus",
        slug: "guide-off-plan-property-investment-cyprus",
        category: "Investment Guide",
        excerpt: "Everything you need to know about buying off-plan in Cyprus, from legal requirements to payment structures.",
        content: "Off-plan property purchases represent one of the most attractive investment strategies in Cyprus real estate. By purchasing during the construction phase, buyers can benefit from lower entry prices, flexible payment terms, and significant capital appreciation by completion.\n\nThis guide covers the essential aspects of off-plan investment: understanding the legal framework, evaluating developer track records, structuring payments around construction milestones, and managing risk. We also discuss the importance of title deed insurance, escrow arrangements, and independent legal representation.\n\nWhether you are a first-time buyer or an experienced investor, understanding these fundamentals will help you make informed decisions and maximize your returns in the Cyprus property market.",
        imageUrl: "/images/articles/off-plan-guide.jpg",
      },
      {
        title: "Construction Update: Symphony Residence Reaches New Milestone",
        slug: "symphony-residence-construction-update-march-2026",
        category: "Project Updates",
        excerpt: "Our flagship Symphony Residence project is progressing on schedule with the superstructure framework nearing completion.",
        content: "We are pleased to share that Symphony Residence in Limassol's tourist area has reached a significant construction milestone. The superstructure framework is progressing on schedule, with the third-floor slab now complete and exterior wall work underway.\n\nThe project remains on track for its planned completion in Q3 2026. Buyers can monitor real-time progress through our construction tracker in the Develta portal, which includes drone footage, photo galleries, and milestone completion status.\n\nWith over 60% of units already reserved or sold, Symphony Residence continues to generate strong interest from both local and international buyers. A limited number of premium units remain available, including a spectacular penthouse on the sixth floor.",
        imageUrl: "/images/articles/symphony-update-march.jpg",
      },
    ],
  });

  console.log("  Created 3 articles");

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
