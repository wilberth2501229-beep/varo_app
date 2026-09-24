-- Permite la frecuencia quincenal (días 15 y fin de mes) y trimestral en transacciones programadas.
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run.

-- Elimina la restricción actual sobre frequency, sin depender de su nombre
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'scheduled_transactions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%frequency%'
  LOOP
    EXECUTE format('ALTER TABLE scheduled_transactions DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE scheduled_transactions
  ADD CONSTRAINT scheduled_transactions_frequency_check
  CHECK (frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual'));

-- Opcional: si registraste tus quincenas como "Cada 2 semanas", conviértelas a quincenal.
-- Revisa primero cuáles son:
--   SELECT id, description, amount, next_due_date FROM scheduled_transactions WHERE frequency = 'biweekly';
-- y luego, si todas son quincenas:
--   UPDATE scheduled_transactions SET frequency = 'semimonthly' WHERE frequency = 'biweekly';
