-- =============================================================
-- Dashboard Logística - Reset de base de datos
-- Correr conectado a la base 'postgres', NO a dashboard_logistica_db
--
-- Uso:
--   psql -U postgres -f database/reset.sql
--   psql -U postgres -d dashboard_logistica_db -f database/schema.sql
--   psql -U postgres -d dashboard_logistica_db -f database/seed.sql
-- =============================================================

-- Cerrar todas las conexiones activas antes de borrar
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'dashboard_logistica_db'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS dashboard_logistica_db;

CREATE DATABASE dashboard_logistica_db;
