-- CreateTable
CREATE TABLE "MarketIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7a8c6e',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "IndexComponent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indexId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    CONSTRAINT "IndexComponent_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "MarketIndex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "indexId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "open" REAL NOT NULL,
    "high" REAL NOT NULL,
    "low" REAL NOT NULL,
    "close" REAL NOT NULL,
    "volume" REAL,
    "changePct" REAL,
    CONSTRAINT "DailyPrice_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "MarketIndex" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketIndex_symbol_key" ON "MarketIndex"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "IndexComponent_indexId_symbol_key" ON "IndexComponent"("indexId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "DailyPrice_indexId_date_key" ON "DailyPrice"("indexId", "date");
