import { create } from 'zustand'
import { toLocalISODate } from '../services/cashFlowService'

export const PROJECTION_PERIOD_MONTHS = { month: 1, quarter: 3, year: 12 }

export function getPeriodEndISO(period) {
  const months = PROJECTION_PERIOD_MONTHS[period]
  if (!months) return null
  const today = new Date()
  return toLocalISODate(new Date(today.getFullYear(), today.getMonth() + months, today.getDate()))
}

/**
 * Store para manejar proyecciones de flujo de caja
 */
export const useCashFlowStore = create((set, get) => ({
  // Estado
  projections: [],
  events: [],
  startingBalance: 0,
  registeredBalance: 0,
  scheduledToDate: 0,
  criticalBalance: 0,
  metrics: null,
  criticalWeeks: [],
  lastUpdated: null,

  // Acciones
  // `result` es la respuesta de calculateCashFlowProjection
  setProjections: (result) => {
    const projections = result.data
    const criticalWeeks = projections
      .filter((p) => p.is_critical)
      .map((p) => p.week_start_date)

    set({
      projections,
      events: result.events ?? [],
      startingBalance: result.startingBalance ?? 0,
      registeredBalance: result.registeredBalance ?? 0,
      scheduledToDate: result.scheduledToDate ?? 0,
      criticalBalance: result.criticalBalance ?? 0,
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
    const endISO = getPeriodEndISO(period)
    const projections = get().projections
    return endISO ? projections.filter((p) => p.week_start_date <= endISO) : projections
  },

  getEventsByPeriod: (period = 'month') => {
    const endISO = getPeriodEndISO(period)
    const events = get().events
    return endISO ? events.filter((e) => e.date <= endISO) : events
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
