import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCashFlowStore } from '../store/cashFlowStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { useTransactionStore } from '../store/transactionStore'
import { getFinancialMetrics } from '../services/cashFlowService'
import { formatCurrency } from '../utils/utils'

const PERIODS = [
  { value: 'month', label: 'Este mes' },
  { value: 3, label: '3 meses' },
  { value: 12, label: '12 meses' },
]

const TONES = {
  positive: { border: 'border-l-forest-700', text: 'text-forest-700' },
  negative: { border: 'border-l-burgundy-700', text: 'text-burgundy-700' },
  neutral: { border: 'border-l-gold-500', text: 'text-charcoal-700' },
}

function MetricCard({ label, value, detail, tone = 'neutral' }) {
  return (
    <div className={`bg-cream-50 border border-bronze-200 border-l-4 rounded-lg p-4 ${TONES[tone].border}`}>
      <p className="text-xs text-charcoal-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 tabular ${TONES[tone].text}`}>{value}</p>
      {detail && <p className="text-xs text-charcoal-500 mt-1">{detail}</p>}
    </div>
  )
}

const money = (n) => formatCurrency(n, 'MXN')
const percent = (n) => (n === null ? '—' : `${n.toFixed(1)}%`)

function periodDetail(metrics, monthlyAverage, fromScheduled) {
  const parts = []
  if (fromScheduled > 0) parts.push(`${money(fromScheduled)} de programados`)
  if (metrics.period !== 'month') parts.push(`Promedio mensual: ${money(monthlyAverage)}`)
  return parts.join(' · ') || null
}

function formatPeriodRange(metrics) {
  const start = new Date(`${metrics.periodStart}T00:00:00`)
  const opts = { day: 'numeric', month: 'short', year: 'numeric' }
  return `${start.toLocaleDateString('es-MX', opts)} – hoy`
}

export default function FinancialMetrics() {
  const { selectedAccountId } = useAuthStore()
  const { setMetrics, metrics } = useCashFlowStore()
  const scheduledTransactions = useScheduledTransactionStore((state) => state.scheduledTransactions)
  const transactions = useTransactionStore((state) => state.transactions)
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!selectedAccountId) return

    const loadMetrics = async () => {
      setLoading(true)
      setError(null)
      const result = await getFinancialMetrics(selectedAccountId, period)
      if (result.success) {
        setMetrics(result.data)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }

    loadMetrics()
  }, [selectedAccountId, period, scheduledTransactions, transactions, setMetrics])

  const periodLabel = PERIODS.find((p) => p.value === period).label.toLowerCase()

  return (
    <div className="space-y-6">
      {/* Selector de periodo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-bronze-300 bg-cream-50 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 sm:px-4 py-1.5 text-sm rounded-md transition ${
                period === p.value
                  ? 'bg-gold-500 text-cream-50 font-medium'
                  : 'text-charcoal-600 hover:bg-cream-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {metrics?.periodStart && !loading && (
          <p className="text-xs text-charcoal-500">
            Periodo: {formatPeriodRange(metrics)}
            {metrics.period !== 'month' && ` · promedios sobre ${metrics.monthsWithData} ${metrics.monthsWithData === 1 ? 'mes' : 'meses'} con datos`}
          </p>
        )}
      </div>

      {error && <div className="bg-burgundy-50 text-burgundy-700 p-3 rounded-lg text-sm">{error}</div>}

      {loading || !metrics?.periodStart ? (
        <div className="bg-cream-50 border border-bronze-200 rounded-lg p-6 text-center text-charcoal-500">
          {loading ? 'Cargando métricas...' : 'Sin datos'}
        </div>
      ) : (
        <>
          {/* Movimientos reales del periodo */}
          <div>
            <h3 className="text-lg mb-3">Movimientos del periodo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <MetricCard
                label={`Ingresos · ${periodLabel}`}
                value={money(metrics.totalIncome)}
                detail={periodDetail(metrics, metrics.avgMonthlyIncome, metrics.scheduledIncome)}
                tone="positive"
              />
              <MetricCard
                label={`Gastos · ${periodLabel}`}
                value={money(metrics.totalExpenses)}
                detail={periodDetail(metrics, metrics.avgMonthlyExpenses, metrics.scheduledExpenses)}
                tone="negative"
              />
              <MetricCard
                label="Flujo neto del periodo"
                value={money(metrics.netFlow)}
                detail={`Tasa de ahorro: ${percent(metrics.savingsRate)} (ingresos − gastos)`}
                tone={metrics.netFlow >= 0 ? 'positive' : 'negative'}
              />
            </div>
          </div>

          {/* Compromisos recurrentes, expresados por mes */}
          <div>
            <h3 className="text-lg mb-1">Proyección mensual</h3>
            <p className="text-xs text-charcoal-500 mb-3">
              Basada en tus transacciones programadas activas, convertidas a su equivalente mensual.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <MetricCard
                label="Ingreso mensual proyectado"
                value={money(metrics.projectedMonthlyIncome)}
                detail="Ingresos programados"
                tone="positive"
              />
              <MetricCard
                label="Gastos fijos mensuales"
                value={money(metrics.fixedMonthlyExpenses)}
                detail="Gastos programados"
                tone="negative"
              />
              <MetricCard
                label="Margen mensual proyectado"
                value={money(metrics.projectedMonthlyMargin)}
                detail="Ingreso proyectado − gastos fijos"
                tone={metrics.projectedMonthlyMargin >= 0 ? 'positive' : 'negative'}
              />
              <MetricCard
                label="Gastos fijos / ingreso"
                value={percent(metrics.fixedExpenseRatio)}
                detail={
                  metrics.projectedMonthlyIncome > 0
                    ? 'Sobre ingreso proyectado · meta < 50%'
                    : 'Sobre ingreso promedio real · meta < 50%'
                }
                tone={metrics.fixedExpenseRatio !== null && metrics.fixedExpenseRatio >= 50 ? 'negative' : 'neutral'}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
