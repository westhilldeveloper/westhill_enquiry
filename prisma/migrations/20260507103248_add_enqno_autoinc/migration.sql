-- AlterTable
CREATE SEQUENCE enquiry_enqno_seq;
ALTER TABLE "Enquiry" ALTER COLUMN "enqNo" SET DEFAULT nextval('enquiry_enqno_seq');
ALTER SEQUENCE enquiry_enqno_seq OWNED BY "Enquiry"."enqNo";
