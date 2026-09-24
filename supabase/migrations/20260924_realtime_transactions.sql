-- Activa Supabase Realtime para transacciones y programados, para que los cambios
-- hechos desde otro dispositivo (p. ej. la cuenta compartida) se vean sin recargar.
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run.

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['transactions', 'scheduled_transactions'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
