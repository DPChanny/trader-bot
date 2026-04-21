\set ON_ERROR_STOP on

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_database
        WHERE datname = 'trader-bot'
    ) THEN
        RAISE EXCEPTION 'Database "trader-bot" was not created';
    END IF;
END
$$;

\connect "trader-bot"

SELECT current_database() AS current_db;