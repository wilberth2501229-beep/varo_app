import { useAuthStore } from '../../store/authStore'
import { useBalanceSummary } from '../../hooks/usePostedTransactions'
import { formatCurrency } from '../../utils/utils'

export default function Header() {
  const { income, expenses } = useBalanceSummary()
  const { userAccounts, selectedAccountId, setSelectedAccountId } = useAuthStore()

  return (
    <header className="bg-cream-50 border-b border-bronze-200 shadow-sm">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-charcoal-700">Varo</h1>
            <p className="text-charcoal-500 text-sm mt-1">Gestiona tus finanzas personales</p>
            {userAccounts.length > 1 && (
              <select
                value={selectedAccountId ?? ''}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                aria-label="Cuenta"
                className="mt-2 max-w-full px-3 py-1.5 text-sm bg-cream-50 border border-bronze-300 rounded-lg text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-bronze-400"
              >
                {userAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                    {account.is_shared ? ' · compartida contigo' : account.shared_with_email ? ' · compartida' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-6 sm:gap-8 text-right w-full sm:w-auto">
            <div className="flex-1 sm:flex-none">
              <p className="text-charcoal-600 text-xs font-semibold uppercase tracking-wide">Ingresos</p>
              <p className="text-2xl sm:text-3xl font-bold text-forest-700 mt-1">
                {formatCurrency(income, 'MXN')}
              </p>
            </div>
            <div className="w-px bg-bronze-300 hidden sm:block"></div>
            <div className="flex-1 sm:flex-none">
              <p className="text-charcoal-600 text-xs font-semibold uppercase tracking-wide">Egresos</p>
              <p className="text-2xl sm:text-3xl font-bold text-burgundy-700 mt-1">
                {formatCurrency(expenses, 'MXN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
