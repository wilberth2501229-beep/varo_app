import { useTransactionStore } from '../../store/transactionStore'
import { formatCurrency } from '../../utils/utils'

export default function Header() {
  const { getTotalIncome, getTotalExpenses } = useTransactionStore()

  return (
    <header className="bg-cream-50 border-b border-bronze-200 shadow-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-700">Varo</h1>
            <p className="text-charcoal-500 text-sm mt-1">Gestiona tus finanzas personales</p>
          </div>

          <div className="flex gap-6 sm:gap-8 text-right w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <p className="text-charcoal-600 text-xs font-semibold uppercase tracking-wide">Ingresos</p>
              <p className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
                {formatCurrency(getTotalIncome(), 'MXN')}
              </p>
            </div>
            <div className="w-px bg-bronze-300 hidden sm:block"></div>
            <div className="flex-1 sm:flex-none">
              <p className="text-charcoal-600 text-xs font-semibold uppercase tracking-wide">Egresos</p>
              <p className="text-2xl sm:text-3xl font-bold text-burgundy-700 mt-1">
                {formatCurrency(getTotalExpenses(), 'MXN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
