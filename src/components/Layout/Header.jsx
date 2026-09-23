import { useTransactionStore } from '../../store/transactionStore'
import { formatCurrency } from '../../utils/utils'

export default function Header() {
  const { getTotalIncome, getTotalExpenses } = useTransactionStore()

  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">💰 Varo App</h1>
            <p className="text-blue-100 mt-2">Gestiona tus ingresos y egresos</p>
          </div>

          <div className="flex gap-8 text-right">
            <div>
              <p className="text-blue-100 text-sm">Ingresos</p>
              <p className="text-3xl font-bold text-green-300">
                {formatCurrency(getTotalIncome(), 'MXN')}
              </p>
            </div>
            <div>
              <p className="text-blue-100 text-sm">Egresos</p>
              <p className="text-3xl font-bold text-red-300">
                {formatCurrency(getTotalExpenses(), 'MXN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
