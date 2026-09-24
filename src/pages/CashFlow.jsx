import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCashFlowStore } from '../store/cashFlowStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { useTransactionStore } from '../store/transactionStore'
import { calculateCashFlowProjection, saveCashFlowProjections } from '../services/cashFlowService'
import { getScheduledTransactions } from '../services/scheduledTransactionService'
import TransactionScheduler from '../components/TransactionScheduler'
import CashFlowChart from '../components/CashFlowChart'
import FinancialMetrics from '../components/FinancialMetrics'
import NotificationsPanel from '../components/NotificationsPanel'
import LiquidityThresholdSetting from '../components/LiquidityThresholdSetting'
import AlertsPanel from '../components/AlertsPanel'
import ScheduledTransactionList from '../components/ScheduledTransactionList'

export default function CashFlow() {
  const { selectedAccountId } = useAuthStore()
  const { setProjections } = useCashFlowStore()
  const { scheduledTransactions, setScheduledTransactions } = useScheduledTransactionStore()
  const transactions = useTransactionStore((state) => state.transactions)

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadScheduled = useCallback(async () => {
    if (!selectedAccountId) return
    const result = await getScheduledTransactions(selectedAccountId)
    if (result.success) setScheduledTransactions(result.data)
  }, [selectedAccountId, setScheduledTransactions])

  useEffect(() => {
    loadScheduled()
  }, [loadScheduled])

  // Recalcular cada vez que cambian los programados (alta, pausa, eliminación) o se registra un movimiento
  useEffect(() => {
    if (!selectedAccountId) return
    let cancelled = false

    const recalculate = async () => {
      setLoading(true)
      const result = await calculateCashFlowProjection(selectedAccountId, 12)
      if (cancelled) return
      if (result.success) {
        setProjections(result)
        setLastUpdated(new Date().toLocaleTimeString())
        saveCashFlowProjections(result.data)
      }
      setLoading(false)
    }

    recalculate()
    return () => {
      cancelled = true
    }
  }, [selectedAccountId, scheduledTransactions, transactions, setProjections])

  const handleRefresh = loadScheduled

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💰 Flujo de Caja</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gestiona tu flujo de caja y proyecciones financieras
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-3 sm:mt-2">Última actualización: {lastUpdated}</p>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b sticky top-0 z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 sm:gap-6 min-w-max sm:min-w-0">
            {[
              { id: 'overview', label: '📊 Resumen', icon: '📊' },
              { id: 'projections', label: '📈 Proyecciones', icon: '📈' },
              { id: 'transactions', label: '📅 Programadas', icon: '📅' },
              { id: 'alerts', label: '⚠️ Alertas', icon: '⚠️' },
              { id: 'settings', label: '⚙️ Configuración', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="sm:hidden">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-4">Métricas Financieras</h2>
              <FinancialMetrics />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <AlertsPanel />
              </div>
              <div>
                <NotificationsPanel />
              </div>
            </div>
          </div>
        )}

        {/* Projections Tab */}
        {activeTab === 'projections' && (
          <CashFlowChart />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-4">➕ Nueva Transacción</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <TransactionScheduler onSuccess={handleRefresh} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <ScheduledTransactionList />
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <AlertsPanel />
            <NotificationsPanel />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <LiquidityThresholdSetting />
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">ℹ️ Información</h2>
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-600">
                <p>
                  <strong>Flujo de Caja:</strong> Sistema de proyección y análisis de liquidez para tu cuenta.
                </p>
                <p>
                  <strong>Transacciones Programadas:</strong> Define gastos e ingresos recurrentes.
                </p>
                <p>
                  <strong>Proyecciones:</strong> Visualiza tu saldo proyectado semana a semana.
                </p>
                <p>
                  <strong>Alertas:</strong> Recibe notificaciones de liquidez crítica y transacciones próximas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
