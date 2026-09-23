import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCashFlowStore } from '../store/cashFlowStore'
import { getFinancialMetrics } from '../services/cashFlowService'

export default function FinancialMetrics() {
  const { selectedAccountId } = useAuthStore()
  const { setMetrics, metrics } = useCashFlowStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedAccountId) return

    const loadMetrics = async () => {
      setLoading(true)
      const result = await getFinancialMetrics(selectedAccountId, 12)
      if (result.success) {
        setMetrics(result.data)
      }
      setLoading(false)
    }

    loadMetrics()
  }, [selectedAccountId, setMetrics])

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 text-center">Cargando métricas...</div>
  }

  if (!metrics) {
    return <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Sin datos</div>
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Ingresos */}
      <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
        <p className="text-xs text-gray-600 uppercase">Ingresos Totales</p>
        <p className="text-2xl font-bold text-green-600">${parseFloat(metrics.totalIncome).toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">Ingresos fijos: ${metrics.fixedIncome.toFixed(2)}</p>
      </div>

      {/* Gastos */}
      <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
        <p className="text-xs text-gray-600 uppercase">Gastos Totales</p>
        <p className="text-2xl font-bold text-red-600">${parseFloat(metrics.totalExpenses).toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">Gastos fijos: ${metrics.fixedExpenses.toFixed(2)}</p>
      </div>

      {/* Balance Neto */}
      <div className={`rounded-lg shadow p-4 border-l-4 ${
        metrics.netBalance >= 0 ? 'bg-blue-50 border-blue-500' : 'bg-orange-50 border-orange-500'
      }`}>
        <p className="text-xs text-gray-600 uppercase">Balance Neto</p>
        <p className={`text-2xl font-bold ${metrics.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          ${parseFloat(metrics.netBalance).toFixed(2)}
        </p>
      </div>

      {/* Ratio Gasto/Ingreso */}
      <div className="bg-purple-50 rounded-lg shadow p-4 border-l-4 border-purple-500">
        <p className="text-xs text-gray-600 uppercase">Ratio Gasto/Ingreso</p>
        <p className="text-2xl font-bold text-purple-600">{metrics.incomeTaxRatio}%</p>
        <p className="text-xs text-gray-500 mt-1">Meta: &lt;50%</p>
      </div>

      {/* Promedio Mensual */}
      <div className="bg-indigo-50 rounded-lg shadow p-4 border-l-4 border-indigo-500">
        <p className="text-xs text-gray-600 uppercase">Ingreso Mensual Proyectado</p>
        <p className="text-2xl font-bold text-indigo-600">${parseFloat(metrics.projectedMonthlyIncome).toFixed(2)}</p>
      </div>

      {/* Gastos Promedio */}
      <div className="bg-cyan-50 rounded-lg shadow p-4 border-l-4 border-cyan-500">
        <p className="text-xs text-gray-600 uppercase">Gasto Mensual Proyectado</p>
        <p className="text-2xl font-bold text-cyan-600">${parseFloat(metrics.projectedMonthlyExpenses).toFixed(2)}</p>
      </div>

      {/* Ahorros Acumulados */}
      <div className="bg-lime-50 rounded-lg shadow p-4 border-l-4 border-lime-500 col-span-2">
        <p className="text-xs text-gray-600 uppercase">Ahorros Acumulados (12 meses)</p>
        <p className="text-3xl font-bold text-lime-600">${parseFloat(metrics.accumulatedSavings).toFixed(2)}</p>
      </div>
    </div>
  )
}
