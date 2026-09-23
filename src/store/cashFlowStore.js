import { create } from 'zustand'

/**
 * Store para manejar proyecciones de flujo de caja
 */
export const useCashFlowStore = create((set, get) => ({
  // Estado
  projections: [],
  metrics: null,
  criticalWeeks: [],
  lastUpdated: null,

  // Acciones
  setProjections: (projections) => {
    // Identificar semanas críticas
    const criticalWeeks = projections
      .filter((p) => p.is_critical)
      .map((p) => p.week_start_date)

    set({
      projections,
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
    const projections = get().projections
    if (projections.length === 0) return []

    if (period === 'month') {
      return projections.slice(0, 4) // 4 semanas ≈ 1 mes
    } else if (period === 'quarter') {
      return projections.slice(0, 12) // 12 semanas ≈ 3 meses
    } else if (period === 'year') {
      return projections.slice(0, 52) // 52 semanas ≈ 1 año
    }
    return projections
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
