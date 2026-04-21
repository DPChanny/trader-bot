\set ON_ERROR_STOP on

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

SELECT r.rolname, m.rolname AS member
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE m.rolname = 'trader-bot';

\connect "trader-bot"

DO $$
BEGIN
    IF NOT has_database_privilege('trader-bot', 'trader-bot', 'CONNECT') THEN
        RAISE EXCEPTION 'Role "trader-bot" is missing CONNECT on database "trader-bot"';
    END IF;

    IF NOT has_schema_privilege('trader-bot', 'public', 'USAGE') THEN
        RAISE EXCEPTION 'Role "trader-bot" is missing USAGE on schema public';
    END IF;

    IF NOT has_schema_privilege('trader-bot', 'public', 'CREATE') THEN
        RAISE EXCEPTION 'Role "trader-bot" is missing CREATE on schema public';
    END IF;
END
$$;