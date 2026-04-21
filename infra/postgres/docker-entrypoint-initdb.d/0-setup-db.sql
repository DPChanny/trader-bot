\set ON_ERROR_STOP on

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'trader-bot' AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS "trader-bot";
CREATE DATABASE "trader-bot";