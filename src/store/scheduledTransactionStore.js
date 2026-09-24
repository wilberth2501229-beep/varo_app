import { create } from 'zustand'
import { getNextOccurrence, toLocalISODate } from '../services/cashFlowService'

const parseISODate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Store para manejar transacciones programadas
 */
export const useScheduledTransactionStore = create((set, get) => ({
  // Estado
  scheduledTransactions: [],
  liquidityThreshold: 0,
  alertDaysBefore: 14,

  // Acciones
  setScheduledTransactions: (transactions) => set({ scheduledTransactions: transactions }),

  addScheduledTransaction: (transaction) => set((state) => ({
    scheduledTransactions: [transaction, ...state.scheduledTransactions],
  })),

  updateScheduledTransaction: (id, updates) => set((state) => ({
    scheduledTransactions: state.scheduledTransactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    ),
  })),

  deleteScheduledTransaction: (id) => set((state) => ({
    scheduledTransactions: state.scheduledTransactions.filter((t) => t.id !== id),
  })),

  setLiquidityThreshold: (threshold, alertDays) => set({
    liquidityThreshold: threshold,
    alertDaysBefore: alertDays,
  }),

  // Getters
  getScheduledTransactionsByCategory: () => {
    const transactions = get().scheduledTransactions
    const byCategory = {}

    transactions.forEach((t) => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = {
          income: 0,
          expense: 0,
        }
      }
      if (t.type === 'income') {
        byCategory[t.category].income += t.amount
      } else {
        byCategory[t.category].expense += t.amount
      }
    })

    return byCategory
  },

  getTotalFixedIncome: () => {
    return get().scheduledTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  },

  getTotalFixedExpenses: () => {
    return get().scheduledTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  },

  // next_due_date es la primera fecha de la serie; aquí se calcula la próxima ocurrencia real
  getUpcomingTransactions: (days = 30) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)

    return get().scheduledTransactions
      .filter((t) => t.is_active)
      .map((t) => {
        const next = getNextOccurrence(t, today)
        return next && { ...t, next_due_date: toLocalISODate(next) }
      })
      .filter((t) => t && parseISODate(t.next_due_date) <= limit)
      .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
  },
}))
