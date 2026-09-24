import { create } from 'zustand'

/**
 * Store para manejar proyecciones de flujo de caja
 */
export const useCashFlowStore = create((set, get) => ({
  // Estado
  projections: [],
  criticalBalance: 0,
  metrics: null,
  criticalWeeks: [],
  lastUpdated: null,

  // Acciones
  setProjections: (projections, criticalBalance = 0) => {
    // Identificar semanas críticas
    const criticalWeeks = projections
      .filter((p) => p.is_critical)
      .map((p) => p.week_start_date)

    set({
      projections,
      criticalBalance,
      criticalWeeks,
      lastUpdated: new Date().toISOString(),
    })
  },

  setMetrics: (metrics) => set({ metrics }),

  addProjections: (newProjections) => set((state) => ({
    projections: [...state.projections, ...newProjections],
  })),

  clearProjections: () => set({
    projections: [],
    criticalWeeks: [],
    metrics: null,
  }),

  // Getters
  getProjectionsByPeriod: (period = 'month') => {
    const months = { month: 1, quarter: 3, year: 12 }[period]
    const projections = get().projections
    if (!months || projections.length === 0) return projections

    const today = new Date()
    const end = new Date(today.getFullYear(), today.getMonth() + months, today.getDate())
    const y = end.getFullYear()
    const m = String(end.getMonth() + 1).padStart(2, '0')
    const d = String(end.getDate()).padStart(2, '0')
    const endISO = `${y}-${m}-${d}`
    return projections.filter((p) => p.week_start_date <= endISO)
  },

  getMinimumBalance: () => {
    const projections = get().projections
    if (projections.length === 0) return 0
    return Math.min(...projections.map((p) => p.projected_balance))
  },

  getMaximumBalance: () => {
    const projections = get().projections
    if (projections.length === 0) return 0
    return Math.max(...projections.map((p) => p.projected_balance))
  },

  getAverageBalance: () => {
    const projections = get().projections
    if (projections.length === 0) return 0
    const total = projections.reduce((sum, p) => sum + p.projected_balance, 0)
    return total / projections.length
  },

  getCriticalWeeksCount: () => {
    return get().criticalWeeks.length
  },

  getProjectionTrend: () => {
    const projections = get().projections
    if (projections.length < 2) return 'flat'

    const first = projections[0].projected_balance
    const last = projections[projections.length - 1].projected_balance

    if (last > first) return 'increasing'
    if (last < first) return 'decreasing'
    return 'flat'
  },

  // Datos formateados para gráficos
  getChartData: () => {
    const projections = get().projections
    return projections.map((p) => ({
      date: p.week_start_date,
      balance: p.projected_balance,
      isCritical: p.is_critical,
    }))
  },
}))
