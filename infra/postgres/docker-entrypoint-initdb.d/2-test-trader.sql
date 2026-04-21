\connect trader

SELECT r.rolname, m.rolname AS member
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE m.rolname = 'trader';

SELECT has_database_privilege('trader', 'trader', 'CONNECT');
SELECT has_schema_privilege('trader', 'public', 'USAGE');
SELECT has_schema_privilege('trader', 'public', 'CREATE');
