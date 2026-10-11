import { useMemo } from 'react'
import { useTransactionStore } from '../store/transactionStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { executedScheduledTransactions, toLocalISODate } from '../services/cashFlowService'

// Programados que ya se ejecutaron, con forma de transacción (solo lectura)
export function useExecutedScheduled() {
  const scheduled = useScheduledTransactionStore((state) => state.scheduledTransactions)
  return useMemo(() => executedScheduledTransactions(scheduled), [scheduled])
}

// Dinero real: transacciones registradas con fecha de hoy o anterior + programados ya ejecutados.
// Es el mismo "Saldo hoy" que muestra Flujo de Caja.
export function usePostedTransactions() {
  const transactions = useTransactionStore((state) => state.transactions)
  const executed = useExecutedScheduled()
  return useMemo(() => {
    const today = toLocalISODate(new Date())
    return [...transactions.filter((t) => t.transaction_date <= today), ...executed]
  }, [transactions, executed])
}

export function useBalanceSummary() {
  const posted = usePostedTransactions()
  return useMemo(() => {
    const sum = (type) => posted.filter((t) => t.type === type).reduce((total, t) => total + (Number(t.amount) || 0), 0)
    const income = sum('income')
    const expenses = sum('expense')
    return { posted, income, expenses, balance: income - expenses }
  }, [posted])
}
