import { useAlertStore } from '../../store/alertStore'

export default function AlertBadge() {
  const { alerts, budgetAlerts, dismissAlert } = useAlertStore()
  const criticalAlerts = alerts.filter(a => a.type === 'critical')

  if (criticalAlerts.length === 0 && budgetAlerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Alertas de presupuesto */}
      {budgetAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ Límite de presupuesto alcanzado
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {alert.category}: {alert.percentage}% del presupuesto
              </p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-yellow-600 hover:text-yellow-800 transition"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {/* Alertas críticas */}
      {criticalAlerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-red-50 border-l-4 border-red-400 p-4 rounded"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-800">
                🚨 Alerta crítica
              </p>
              <p className="text-sm text-red-700 mt-1">
                {alert.message}
              </p>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-red-600 hover:text-red-800 transition"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
