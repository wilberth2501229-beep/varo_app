import { create } from 'zustand'

/**
 * Store global para manejar alertas de presupuesto
 */
export const useAlertStore = create((set, get) => ({
  // Estado
  alerts: [],
  budgetAlerts: [],
  dismissedAlerts: [],

  // Acciones - Alertas
  setAlerts: (alerts) => set({ alerts }),
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts],
  })),
  
  dismissAlert: (alertId) => set((state) => ({
    dismissedAlerts: [...state.dismissedAlerts, alertId],
    alerts: state.alerts.filter((a) => a.id !== alertId),
  })),

  // Acciones - Presupuestos
  setBudgetAlerts: (budgetAlerts) => set({ budgetAlerts }),
  
  addBudgetAlert: (budgetAlert) => set((state) => ({
    budgetAlerts: [...state.budgetAlerts, budgetAlert],
  })),
  
  updateBudgetAlert: (id, updatedAlert) => set((state) => ({
    budgetAlerts: state.budgetAlerts.map((a) =>
      a.id === id ? { ...a, ...updatedAlert } : a
    ),
  })),
  
  deleteBudgetAlert: (id) => set((state) => ({
    budgetAlerts: state.budgetAlerts.filter((a) => a.id !== id),
  })),

  // Getters - Alertas activas (no descartadas)
  getActiveAlerts: () => {
    const state = get()
    return state.alerts.filter((a) => !state.dismissedAlerts.includes(a.id))
  },

  // Getters - Alertas críticas
  getCriticalAlerts: () => {
    return get().getActiveAlerts().filter((a) => a.alert_type === 'critical')
  },

  // Getters - Alertas de advertencia
  getWarningAlerts: () => {
    return get().getActiveAlerts().filter((a) => a.alert_type === 'warning')
  },

  // Getters - Presupuesto por categoría
  getBudgetByCategory: (category) => {
    const budget = get().budgetAlerts.find((b) => b.category === category)
    return budget?.monthly_limit || null
  },

  // Getters - ¿Existe presupuesto para categoría?
  hasBudget: (category) => {
    return get().budgetAlerts.some((b) => b.category === category && b.is_active)
  },
}))
