-- AlterTable
ALTER TABLE "DMCQuotation" ADD COLUMN     "dmcId" INTEGER,
ALTER COLUMN "dmcName" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Dmc" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dmc_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DMCQuotation" ADD CONSTRAINT "DMCQuotation_dmcId_fkey" FOREIGN KEY ("dmcId") REFERENCES "Dmc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
