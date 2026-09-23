import { create } from 'zustand'

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

  getUpcomingTransactions: (days = 30) => {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    return get().scheduledTransactions
      .filter((t) => {
        const transDate = new Date(t.next_due_date)
        return transDate >= today && transDate <= futureDate && t.is_active
      })
      .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date))
  },
}))
