-- AlterTable
ALTER TABLE "InvestorInvestment" ADD COLUMN "tokens" REAL;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT,
    "holdingId" TEXT,
    "type" TEXT NOT NULL,
    "tokens" REAL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_holdingId_fkey" FOREIGN KEY ("holdingId") REFERENCES "InvestorInvestment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MembershipTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "minTicket" REAL NOT NULL,
    "maxTicket" REAL,
    "perks" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "tokenSymbol" TEXT,
    "totalTokens" INTEGER,
    "pricePerToken" REAL,
    "tokensSold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_InvestmentPool" ("capitalType", "city", "constructionThesis", "country", "createdAt", "dealType", "demandThesis", "description", "developerCoinvestPct", "exitThesis", "exitType", "goalAmount", "hurdleRate", "id", "imageUrl", "locationThesis", "ltc", "ltv", "maxTicket", "minTicket", "name", "preferredReturn", "projectName", "raiseEnd", "raisedAmount", "slug", "spvName", "status", "summary", "targetIrr", "targetYield", "termMonths", "updatedAt") SELECT "capitalType", "city", "constructionThesis", "country", "createdAt", "dealType", "demandThesis", "description", "developerCoinvestPct", "exitThesis", "exitType", "goalAmount", "hurdleRate", "id", "imageUrl", "locationThesis", "ltc", "ltv", "maxTicket", "minTicket", "name", "preferredReturn", "projectName", "raiseEnd", "raisedAmount", "slug", "spvName", "status", "summary", "targetIrr", "targetYield", "termMonths", "updatedAt" FROM "InvestmentPool";
DROP TABLE "InvestmentPool";
ALTER TABLE "new_InvestmentPool" RENAME TO "InvestmentPool";
CREATE UNIQUE INDEX "InvestmentPool_slug_key" ON "InvestmentPool"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_poolId_idx" ON "Transaction"("poolId");

-- CreateIndex
CREATE INDEX "Transaction_holdingId_idx" ON "Transaction"("holdingId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipTier_slug_key" ON "MembershipTier"("slug");
