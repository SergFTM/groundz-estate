-- CreateTable
CREATE TABLE "WalletAddress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" TEXT NOT NULL DEFAULT 'evm',
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "walletAddressId" TEXT,
    "tokens" INTEGER NOT NULL,
    "pricePerToken" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentReference" TEXT NOT NULL,
    "transferDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "expiresAt" DATETIME NOT NULL,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentIntent_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentIntent_walletAddressId_fkey" FOREIGN KEY ("walletAddressId") REFERENCES "WalletAddress" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "poolId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'rental',
    "formula" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "totalAmount" REAL NOT NULL,
    "eligibleSupply" REAL NOT NULL DEFAULT 0,
    "snapshotAt" DATETIME,
    "windowStart" DATETIME,
    "windowEnd" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Distribution_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "InvestmentPool" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DistributionPayout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "distributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT,
    "snapshotTokens" REAL NOT NULL,
    "grossAmount" REAL NOT NULL,
    "netAmount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'created',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DistributionPayout_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DistributionPayout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletAddress_address_key" ON "WalletAddress"("address");

-- CreateIndex
CREATE INDEX "WalletAddress_userId_idx" ON "WalletAddress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_paymentReference_key" ON "PaymentIntent"("paymentReference");

-- CreateIndex
CREATE INDEX "PaymentIntent_userId_idx" ON "PaymentIntent"("userId");

-- CreateIndex
CREATE INDEX "PaymentIntent_poolId_idx" ON "PaymentIntent"("poolId");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "Distribution_poolId_idx" ON "Distribution"("poolId");

-- CreateIndex
CREATE INDEX "DistributionPayout_userId_idx" ON "DistributionPayout"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionPayout_distributionId_userId_key" ON "DistributionPayout"("distributionId", "userId");
