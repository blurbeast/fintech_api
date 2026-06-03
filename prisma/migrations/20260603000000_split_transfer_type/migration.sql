-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('FUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'WITHDRAWAL');

ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING (
  CASE 
    WHEN "type"::text = 'TRANSFER' AND "amount" < 0 THEN 'TRANSFER_OUT'::"TransactionType_new"
    WHEN "type"::text = 'TRANSFER' AND "amount" >= 0 THEN 'TRANSFER_IN'::"TransactionType_new"
    ELSE "type"::text::"TransactionType_new"
  END
);

ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;
