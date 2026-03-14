-- CreateTable
CREATE TABLE "OtcListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "investmentId" TEXT,
    "unitId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "askPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtcListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OtcListing_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "InvestorInvestment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OtcListing_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OtcOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtcOffer_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "OtcListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OtcOffer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
