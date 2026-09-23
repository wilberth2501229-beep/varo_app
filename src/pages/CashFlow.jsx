import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCashFlowStore } from '../store/cashFlowStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { calculateCashFlowProjection, saveCashFlowProjections } from '../services/cashFlowService'
import { getScheduledTransactions } from '../services/scheduledTransactionService'
import TransactionScheduler from '../components/TransactionScheduler'
import CashFlowChart from '../components/CashFlowChart'
import FinancialMetrics from '../components/FinancialMetrics'
import NotificationsPanel from '../components/NotificationsPanel'
import LiquidityThresholdSetting from '../components/LiquidityThresholdSetting'
import AlertsPanel from '../components/AlertsPanel'

// Para el componente auxiliar
function ScheduledTransactionsList() {
  const { scheduledTransactions } = useScheduledTransactionStore()

  if (scheduledTransactions.length === 0) {
    return <p className="text-gray-500 text-sm">Sin transacciones programadas</p>
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {scheduledTransactions.slice(0, 10).map((t) => (
        <div key={t.id} className="border rounded p-2 text-xs">
          <p className="font-semibold">{t.description}</p>
          <p className={t.type === 'income' ? 'text-green-600' : 'text-red-600'}>
            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
          </p>
          <p className="text-gray-500">{t.frequency}</p>
        </div>
      ))}
    </div>
  )
}

export default function CashFlow() {
  const { selectedAccountId } = useAuthStore()
  const { setProjections } = useCashFlowStore()
  const { setScheduledTransactions } = useScheduledTransactionStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!selectedAccountId) return

    const loadData = async () => {
      setLoading(true)
      try {
        // Cargar transacciones programadas
        const transResult = await getScheduledTransactions(selectedAccountId)
        if (transResult.success) {
          setScheduledTransactions(transResult.data)
        }

        // Calcular proyecciones
        const projResult = await calculateCashFlowProjection(selectedAccountId, 12)
        if (projResult.success) {
          setProjections(projResult.data)
          // Guardar proyecciones en DB
          await saveCashFlowProjections(projResult.data)
        }

        setLastUpdated(new Date().toLocaleTimeString())
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedAccountId, setProjections, setScheduledTransactions])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const projResult = await calculateCashFlowProjection(selectedAccountId, 12)
      if (projResult.success) {
        setProjections(projResult.data)
        await saveCashFlowProjections(projResult.data)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error('Error refrescando:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">💰 Flujo de Caja</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gestiona tu flujo de caja y proyecciones financieras
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-2">Última actualización: {lastUpdated}</p>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
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
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Métricas Financieras</h2>
              <FinancialMetrics />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
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
          <div className="space-y-6">
            <CashFlowChart period="year" />

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold mb-4">Períodos Disponibles</h2>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { period: 'month', label: 'Próximo Mes' },
                  { period: 'quarter', label: 'Próximo Trimestre' },
                  { period: 'year', label: 'Próximo Año' },
                ].map((p) => (
                  <button
                    key={p.period}
                    className="px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <TransactionScheduler onSuccess={handleRefresh} />
            </div>
            <div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-bold mb-4">📋 Próximas Transacciones</h3>
                <ScheduledTransactionsList />
              </div>
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
          <div className="grid grid-cols-2 gap-6">
            <LiquidityThresholdSetting />
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">ℹ️ Información</h2>
              <div className="space-y-4 text-sm text-gray-600">
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
