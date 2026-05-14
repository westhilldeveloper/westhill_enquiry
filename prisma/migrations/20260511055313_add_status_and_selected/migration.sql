-- AlterTable
ALTER TABLE "DMCQuotation" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'WORKING';
