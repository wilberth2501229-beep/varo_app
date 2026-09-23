import { create } from 'zustand'

/**
 * Store global para manejar transacciones
 * Usa Zustand para un estado ligero y eficiente
 */
export const useTransactionStore = create((set, get) => ({
  // Estado
  transactions: [],
  selectedAccount: null,
  filters: {
    category: null,
    type: null,
    dateFrom: null,
    dateTo: null,
  },

  // Acciones - Transacciones
  setTransactions: (transactions) => set({ transactions }),
  
  addTransaction: (transaction) => set((state) => ({
    transactions: [transaction, ...state.transactions],
  })),
  
  updateTransaction: (id, updatedTransaction) => set((state) => ({
    transactions: state.transactions.map((t) =>
      t.id === id ? { ...t, ...updatedTransaction } : t
    ),
  })),
  
  deleteTransaction: (id) => set((state) => ({
    transactions: state.transactions.filter((t) => t.id !== id),
  })),

  // Acciones - Cuenta seleccionada
  setSelectedAccount: (accountId) => set({ selectedAccount: accountId }),

  // Acciones - Filtros
  setFilters: (filters) => set({ filters }),
  
  clearFilters: () => set({
    filters: {
      category: null,
      type: null,
      dateFrom: null,
      dateTo: null,
    },
  }),

  // Getters - Transacciones filtradas
  getFilteredTransactions: () => {
    const state = get()
    return state.transactions.filter((transaction) => {
      if (state.filters.category && transaction.category !== state.filters.category) {
        return false
      }
      if (state.filters.type && transaction.type !== state.filters.type) {
        return false
      }
      // Aquí puedes agregar más filtros
      return true
    })
  },

  // Getters - Estadísticas
  getTotalIncome: () => {
    return get().transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  },

  getTotalExpenses: () => {
    return get().transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  },

  getTransactionsByCategory: () => {
    const transactions = get().transactions
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
}))
