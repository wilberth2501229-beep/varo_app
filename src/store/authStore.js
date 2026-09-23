import { create } from 'zustand'

/**
 * Store global para manejar autenticación
 */
export const useAuthStore = create((set, get) => ({
  // Estado
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  userAccounts: [],
  selectedAccountId: null,

  // Acciones - Usuario
  setUser: (user) => set({
    user,
    isAuthenticated: !!user
  }),

  setSession: (session) => set({ session }),

  clearAuth: () => set({
    user: null,
    session: null,
    isAuthenticated: false,
    userAccounts: [],
    selectedAccountId: null,
  }),

  // Acciones - Loading
  setLoading: (isLoading) => set({ isLoading }),

  // Acciones - Cuentas
  setUserAccounts: (accounts) => set({ userAccounts: accounts }),

  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),

  addUserAccount: (account) => set((state) => ({
    userAccounts: [...state.userAccounts, account],
  })),

  // Getters
  getUserEmail: () => {
    const state = get()
    return state.user?.email || null
  },

  getUserId: () => {
    const state = get()
    return state.user?.id || null
  },

  getSelectedAccount: () => {
    const state = get()
    return state.userAccounts.find(a => a.id === state.selectedAccountId)
  },
}))
