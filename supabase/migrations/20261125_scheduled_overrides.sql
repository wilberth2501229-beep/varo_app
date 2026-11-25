-- Ajustes puntuales de una transacción programada: por fecha original del pago, su fecha y monto reales.
-- Ejemplo: {"2026-11-30": {"date": "2026-11-24", "amount": 21500}} = la quincena del 30 llegó el 24 y fue mayor.
-- Los demás pagos de la serie no cambian.
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run.

ALTER TABLE public.scheduled_transactions
  ADD COLUMN IF NOT EXISTS overrides jsonb NOT NULL DEFAULT '{}'::jsonb;
