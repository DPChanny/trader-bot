DROP ROLE IF EXISTS "trader-bot";
CREATE ROLE "trader-bot" LOGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rds_iam') THEN
        GRANT rds_iam TO "trader-bot";
    END IF;
END
$$;

GRANT CONNECT ON DATABASE "trader-bot" TO "trader-bot";
