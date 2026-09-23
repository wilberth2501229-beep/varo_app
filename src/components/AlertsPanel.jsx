import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCashFlowStore } from '../store/cashFlowStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { calculateCashFlowProjection } from '../services/cashFlowService'
import { getScheduledTransactions } from '../services/scheduledTransactionService'

export default function AlertsPanel() {
  const { selectedAccountId } = useAuthStore()
  const { projections } = useCashFlowStore()
  const { liquidityThreshold, getUpcomingTransactions } = useScheduledTransactionStore()

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedAccountId) return

    const generateAlerts = async () => {
      setLoading(true)
      const alertsArray = []

      // Alertas de liquidez crítica
      const criticalProjections = projections.filter((p) => p.is_critical)
      if (criticalProjections.length > 0) {
        const firstCritical = criticalProjections[0]
        alertsArray.push({
          id: 'liquidity-critical',
          type: 'critical_liquidity',
          title: '⚠️ Alerta de Liquidez Crítica',
          message: `Saldo proyectado caerá a $${firstCritical.projected_balance.toFixed(2)} el ${firstCritical.week_start_date}`,
          severity: 'high',
        })
      }

      // Alertas de transacciones próximas
      const upcomingTransactions = getUpcomingTransactions(7)
      if (upcomingTransactions.length > 0) {
        upcomingTransactions.forEach((transaction) => {
          const daysUntil = Math.ceil(
            (new Date(transaction.next_due_date) - new Date()) / (1000 * 60 * 60 * 24)
          )
          alertsArray.push({
            id: `transaction-${transaction.id}`,
            type: 'scheduled_transaction',
            title: `📅 ${transaction.type === 'income' ? 'Ingreso' : 'Gasto'} Próximo`,
            message: `${transaction.description} de $${transaction.amount.toFixed(2)} en ${daysUntil} días`,
            severity: 'medium',
          })
        })
      }

      setAlerts(alertsArray)
      setLoading(false)
    }

    generateAlerts()
  }, [selectedAccountId, projections, getUpcomingTransactions])

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-500'
      case 'medium':
        return 'bg-yellow-50 border-yellow-500'
      default:
        return 'bg-blue-50 border-blue-500'
    }
  }

  const getSeverityTextColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'text-red-700'
      case 'medium':
        return 'text-yellow-700'
      default:
        return 'text-blue-700'
    }
  }

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 text-center">Generando alertas...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Alertas Activas</h2>
        <span className="bg-red-600 text-white text-sm font-bold px-3 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>✅ No hay alertas activas</p>
          <p className="text-xs mt-2">Tu flujo de caja se ve saludable</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded p-4 ${getSeverityColor(alert.severity)}`}
            >
              <h3 className={`font-semibold ${getSeverityTextColor(alert.severity)} mb-1`}>
                {alert.title}
              </h3>
              <p className="text-sm text-gray-700">{alert.message}</p>

              {alert.severity === 'high' && (
                <button className="mt-2 text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                  Tomar acción
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resumen de riesgos */}
      {alerts.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3 text-sm">📊 Análisis de Riesgo</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded text-xs">
              <p className="text-gray-600">Alertas Críticas</p>
              <p className="text-lg font-bold">
                {alerts.filter((a) => a.severity === 'high').length}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded text-xs">
              <p className="text-gray-600">Alertas Moderadas</p>
              <p className="text-lg font-bold">
                {alerts.filter((a) => a.severity === 'medium').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
