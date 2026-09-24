import { useEffect } from 'react'
import { supabase } from '../services/supabase'
import { getTransactions } from '../services/transactionService'
import { getScheduledTransactions } from '../services/scheduledTransactionService'
import { useTransactionStore } from '../store/transactionStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'

// Mantiene transacciones y programados sincronizados entre dispositivos (p. ej. la cuenta compartida en pareja).
// Al recargar los stores, el flujo de caja y las métricas se recalculan solos.
export function useRealtimeSync(accountId) {
  const setTransactions = useTransactionStore((state) => state.setTransactions)
  const setScheduledTransactions = useScheduledTransactionStore((state) => state.setScheduledTransactions)

  useEffect(() => {
    if (!accountId) return

    const reloadTransactions = async () => {
      const result = await getTransactions(accountId)
      if (result.success) setTransactions(result.data || [])
    }
    const reloadScheduled = async () => {
      const result = await getScheduledTransactions(accountId)
      if (result.success) setScheduledTransactions(result.data || [])
    }

    const filter = `account_id=eq.${accountId}`
    const channel = supabase
      .channel(`account-sync-${accountId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter }, reloadTransactions)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions', filter }, reloadTransactions)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scheduled_transactions', filter }, reloadScheduled)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scheduled_transactions', filter }, reloadScheduled)
      // Supabase no permite filtrar los DELETE por columna, así que cualquier borrado recarga
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' }, reloadTransactions)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'scheduled_transactions' }, reloadScheduled)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [accountId, setTransactions, setScheduledTransactions])
}
