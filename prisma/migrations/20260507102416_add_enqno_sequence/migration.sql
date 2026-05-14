-- Create the sequence starting at 1000
CREATE SEQUENCE "enquiry_enqno_seq" START 1000;

-- Set default value on the enqNo column
ALTER TABLE "Enquiry" ALTER COLUMN "enqNo" SET DEFAULT nextval('enquiry_enqno_seq');

-- (Optional) If you want existing rows to get numbers, you can update them manually,
-- but usually you start with an empty table.