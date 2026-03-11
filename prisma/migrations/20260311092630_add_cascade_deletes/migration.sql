-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConstructionMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phaseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "caption" TEXT,
    CONSTRAINT "ConstructionMedia_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "ConstructionPhase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ConstructionMedia" ("caption", "id", "phaseId", "type", "url") SELECT "caption", "id", "phaseId", "type", "url" FROM "ConstructionMedia";
DROP TABLE "ConstructionMedia";
ALTER TABLE "new_ConstructionMedia" RENAME TO "ConstructionMedia";
CREATE TABLE "new_ConstructionPhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "ConstructionPhase_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ConstructionPhase" ("description", "endDate", "id", "name", "projectId", "sortOrder", "startDate", "status") SELECT "description", "endDate", "id", "name", "projectId", "sortOrder", "startDate", "status" FROM "ConstructionPhase";
DROP TABLE "ConstructionPhase";
ALTER TABLE "new_ConstructionPhase" RENAME TO "ConstructionPhase";
CREATE TABLE "new_Unit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL,
    "areaSqm" REAL NOT NULL,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "buyerId" TEXT,
    CONSTRAINT "Unit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Unit_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Unit" ("areaSqm", "bedrooms", "buyerId", "code", "floor", "id", "price", "projectId", "status", "type") SELECT "areaSqm", "bedrooms", "buyerId", "code", "floor", "id", "price", "projectId", "status", "type" FROM "Unit";
DROP TABLE "Unit";
ALTER TABLE "new_Unit" RENAME TO "Unit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
