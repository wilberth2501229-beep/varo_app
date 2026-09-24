import { useTransactionStore } from '../../store/transactionStore'
import { formatCurrency, groupByCategory } from '../../utils/utils'

export default function SpendingChart() {
  const { getPostedTransactions } = useTransactionStore()

  const expenses = getPostedTransactions().filter(t => t.type === 'expense')
  const categorySpending = groupByCategory(expenses)

  // Calcular total y porcentajes
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0)
  const categoryData = Object.entries(categorySpending)
    .map(([category, items]) => {
      const amount = items.reduce((sum, t) => sum + t.amount, 0)
      return {
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent * 100).toFixed(1) : 0
      }
    })
    .sort((a, b) => b.amount - a.amount)

  // Colores para las barras
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de barras */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">📊 Gastos por Categoría</h3>

        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay datos de gastos
          </div>
        ) : (
          <div className="space-y-4">
            {categoryData.map((item, index) => (
              <div key={item.category}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {item.category}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.amount, 'MXN')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: colors[index % colors.length]
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.percentage}% del total
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen por categoría */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-6">💰 Resumen de Gastos</h3>

        {categoryData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay datos de gastos
          </div>
        ) : (
          <div className="space-y-3">
            {categoryData.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.amount, 'MXN')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center p-3">
                <span className="font-bold text-gray-900">Total Gastos:</span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(totalSpent, 'MXN')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
