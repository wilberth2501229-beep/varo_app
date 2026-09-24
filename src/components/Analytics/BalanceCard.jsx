import { useTransactionStore } from '../../store/transactionStore'
import { formatCurrency } from '../../utils/utils'

export default function BalanceCard() {
  const { getPostedTransactions, getTotalIncome, getTotalExpenses } = useTransactionStore()
  const transactions = getPostedTransactions()

  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()
  const balance = totalIncome - totalExpenses

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Balance Total */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-100 text-sm font-medium">Balance Total</p>
            <h3 className="text-4xl font-bold mt-2">
              {formatCurrency(balance, 'MXN')}
            </h3>
          </div>
          <div className="text-4xl">💰</div>
        </div>
        <p className="text-blue-100 text-xs mt-4">
          {transactions.length} transacciones
        </p>
      </div>

      {/* Ingresos */}
      <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-green-100 text-sm font-medium">Ingresos</p>
            <h3 className="text-4xl font-bold mt-2">
              {formatCurrency(totalIncome, 'MXN')}
            </h3>
          </div>
          <div className="text-4xl">📈</div>
        </div>
        <p className="text-green-100 text-xs mt-4">
          {transactions.filter(t => t.type === 'income').length} ingresos
        </p>
      </div>

      {/* Egresos */}
      <div className="bg-gradient-to-br from-red-500 to-red-700 text-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-red-100 text-sm font-medium">Egresos</p>
            <h3 className="text-4xl font-bold mt-2">
              {formatCurrency(totalExpenses, 'MXN')}
            </h3>
          </div>
          <div className="text-4xl">📉</div>
        </div>
        <p className="text-red-100 text-xs mt-4">
          {transactions.filter(t => t.type === 'expense').length} egresos
        </p>
      </div>
    </div>
  )
}
