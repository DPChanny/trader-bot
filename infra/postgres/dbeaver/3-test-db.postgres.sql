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

SELECT datname
FROM pg_database
WHERE datname = 'trader-bot';
