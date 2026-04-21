DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = 'trader-bot'
    ) THEN
        RAISE EXCEPTION 'Role "trader-bot" was not created';
    END IF;
END
$$;

SELECT has_database_privilege('trader-bot', 'trader-bot', 'CONNECT') AS has_connect;
SELECT has_schema_privilege('trader-bot', 'public', 'USAGE') AS has_schema_usage;
SELECT has_schema_privilege('trader-bot', 'public', 'CREATE') AS has_schema_create;
