-- accounts.balance solo suma las transacciones registradas a mano (no los programados),
-- así que puede quedar negativo aunque el dinero real sea positivo. La regla bloqueaba
-- registrar gastos con "violates check constraint positive_balance".
-- La app calcula el dinero real (registradas + programados ejecutados) y ya no depende de este saldo.
-- Ejecutar en Supabase: SQL Editor → New query → pegar → Run.

ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS positive_balance;
