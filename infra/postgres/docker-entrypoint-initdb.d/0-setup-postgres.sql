SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'trader' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS trader;
CREATE DATABASE trader;

DROP ROLE IF EXISTS trader;
CREATE ROLE trader LOGIN;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rds_iam') THEN
        GRANT rds_iam TO trader;
    END IF;
END
$$;

GRANT CONNECT ON DATABASE trader TO trader;
