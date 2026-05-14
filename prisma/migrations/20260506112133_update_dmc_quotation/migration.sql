/*
  Warnings:

  - You are about to drop the column `actualPaxCharged` on the `DMCQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `actualRatePerPax` on the `DMCQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `dmcRate` on the `DMCQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `margin` on the `DMCQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `pax` on the `DMCQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `salesPriceBeforeGst` on the `DMCQuotation` table. All the data in the column will be lost.
  - Added the required column `actualAdultCharged` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adultCount` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adultMargin` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adultRate` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kidCount` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kidMargin` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kidRate` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAdultCost` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalKidCost` to the `DMCQuotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DMCQuotation" DROP COLUMN "actualPaxCharged",
DROP COLUMN "actualRatePerPax",
DROP COLUMN "dmcRate",
DROP COLUMN "margin",
DROP COLUMN "pax",
DROP COLUMN "salesPriceBeforeGst",
ADD COLUMN     "actualAdultCharged" INTEGER NOT NULL,
ADD COLUMN     "adultCount" INTEGER NOT NULL,
ADD COLUMN     "adultMargin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "adultRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "kidCount" INTEGER NOT NULL,
ADD COLUMN     "kidMargin" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "kidRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalAdultCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalKidCost" DOUBLE PRECISION NOT NULL;
