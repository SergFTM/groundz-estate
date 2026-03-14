/*
  Warnings:

  - You are about to drop the `LeadNote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `paidAt` on the `Commission` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Document` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "floorPlanUrl" TEXT;
ALTER TABLE "Unit" ADD COLUMN "tourFloorPlan" TEXT;
ALTER TABLE "Unit" ADD COLUMN "tourImages" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LeadNote";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plannedDate" DATETIME NOT NULL,
    "actualDate" DATETIME,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Milestone_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConstructionReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL,
    "overallPct" INTEGER NOT NULL,
    "budgetTotal" REAL NOT NULL,
    "budgetSpent" REAL NOT NULL,
    "budgetVariance" REAL NOT NULL,
    "notes" TEXT,
    "aiAnalysis" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConstructionReport_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiResponseCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArticleComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ArticleComment" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "ArticleCommentLike" (
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("commentId", "userId"),
    CONSTRAINT "ArticleCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ArticleComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeoKeywordCluster" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "primaryTerm" TEXT NOT NULL,
    "termsJson" TEXT NOT NULL,
    "entitiesJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SeoPageProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "route" TEXT,
    "articleId" TEXT,
    "locale" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "primaryClusterId" TEXT,
    "targetKeywords" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "seoScore" REAL,
    "lastAuditAt" DATETIME,
    "lastAiRunAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SeoPageProfile_primaryClusterId_fkey" FOREIGN KEY ("primaryClusterId") REFERENCES "SeoKeywordCluster" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeoAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seoPageProfileId" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "issuesJson" TEXT NOT NULL,
    "suggestionsJson" TEXT NOT NULL,
    "aiSummary" TEXT,
    "aiAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoAudit_seoPageProfileId_fkey" FOREIGN KEY ("seoPageProfileId") REFERENCES "SeoPageProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InternalLinkSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromProfileId" TEXT NOT NULL,
    "toProfileId" TEXT NOT NULL,
    "fromRoute" TEXT NOT NULL,
    "toRoute" TEXT NOT NULL,
    "anchorText" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InternalLinkSuggestion_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "SeoPageProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InternalLinkSuggestion_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "SeoPageProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SeoContentRevision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seoPageProfileId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "proposedText" TEXT NOT NULL,
    "diffJson" TEXT,
    "changeType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoContentRevision_seoPageProfileId_fkey" FOREIGN KEY ("seoPageProfileId") REFERENCES "SeoPageProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commission" ("agentId", "amount", "createdAt", "description", "id", "status") SELECT "agentId", "amount", "createdAt", "description", "id", "status" FROM "Commission";
DROP TABLE "Commission";
ALTER TABLE "new_Commission" RENAME TO "Commission";
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("category", "fileSize", "fileUrl", "id", "name", "status", "uploadedAt", "userId") SELECT "category", "fileSize", "fileUrl", "id", "name", "status", "uploadedAt", "userId" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
CREATE TABLE "new_InvestmentPool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Cyprus',
    "city" TEXT,
    "dealType" TEXT,
    "goalAmount" REAL NOT NULL,
    "raisedAmount" REAL NOT NULL DEFAULT 0,
    "targetYield" REAL NOT NULL,
    "targetIrr" REAL,
    "preferredReturn" REAL,
    "hurdleRate" REAL,
    "termMonths" INTEGER NOT NULL,
    "minTicket" REAL NOT NULL,
    "maxTicket" REAL,
    "exitType" TEXT,
    "capitalType" TEXT,
    "spvName" TEXT,
    "ltv" REAL,
    "ltc" REAL,
    "developerCoinvestPct" REAL,
    "raiseEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "imageUrl" TEXT,
    "description" TEXT,
    "locationThesis" TEXT,
    "demandThesis" TEXT,
    "constructionThesis" TEXT,
    "exitThesis" TEXT,
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_InvestmentPool" ("createdAt", "description", "goalAmount", "id", "imageUrl", "minTicket", "name", "projectName", "raisedAmount", "status", "targetYield", "termMonths") SELECT "createdAt", "description", "goalAmount", "id", "imageUrl", "minTicket", "name", "projectName", "raisedAmount", "status", "targetYield", "termMonths" FROM "InvestmentPool";
DROP TABLE "InvestmentPool";
ALTER TABLE "new_InvestmentPool" RENAME TO "InvestmentPool";
CREATE UNIQUE INDEX "InvestmentPool_slug_key" ON "InvestmentPool"("slug");
CREATE TABLE "new_InvestorInvestment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'soft_commit',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvestorInvestment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvestorInvestment_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InvestorInvestment" ("amount", "createdAt", "id", "poolId", "userId") SELECT "amount", "createdAt", "id", "poolId", "userId" FROM "InvestorInvestment";
DROP TABLE "InvestorInvestment";
ALTER TABLE "new_InvestorInvestment" RENAME TO "InvestorInvestment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AiResponseCache_cacheKey_key" ON "AiResponseCache"("cacheKey");

-- CreateIndex
CREATE UNIQUE INDEX "SeoPageProfile_route_key" ON "SeoPageProfile"("route");

-- CreateIndex
CREATE UNIQUE INDEX "SeoPageProfile_articleId_key" ON "SeoPageProfile"("articleId");
