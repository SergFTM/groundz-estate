-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_JobApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "positionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "linkedinUrl" TEXT,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobApplication_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "JobPosition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JobApplication" ("coverLetter", "createdAt", "email", "id", "linkedinUrl", "name", "positionId", "resumeUrl") SELECT "coverLetter", "createdAt", "email", "id", "linkedinUrl", "name", "positionId", "resumeUrl" FROM "JobApplication";
DROP TABLE "JobApplication";
ALTER TABLE "new_JobApplication" RENAME TO "JobApplication";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
