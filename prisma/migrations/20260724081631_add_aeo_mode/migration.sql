-- AlterTable
ALTER TABLE "SeoAudit" ADD COLUMN "aeoIssuesJson" TEXT;
ALTER TABLE "SeoAudit" ADD COLUMN "aeoScore" REAL;

-- AlterTable
ALTER TABLE "SeoPageProfile" ADD COLUMN "aeoScore" REAL;
