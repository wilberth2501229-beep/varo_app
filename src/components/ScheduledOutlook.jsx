import { useMemo } from 'react'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { installmentProgress, scheduledByMonth, toMonthlyAmount } from '../services/cashFlowService'
import { formatCurrency } from '../utils/utils'

const money = (n) => formatCurrency(n, 'MXN')
// Sin centavos en la tabla para que las cuatro columnas quepan en celular
const money0 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format
const parseDate = (iso) => new Date(`${iso}T00:00:00`)
const monthLabel = (iso) => parseDate(iso).toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
const dayLabel = (iso) => parseDate(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

export default function ScheduledOutlook() {
  const scheduled = useScheduledTransactionStore((state) => state.scheduledTransactions)

  const months = useMemo(() => scheduledByMonth(scheduled), [scheduled])
  const commitments = useMemo(
    () =>
      scheduled
        .filter((s) => s.is_active === true)
        .map((s) => ({ s, progress: installmentProgress(s) }))
        .filter(({ progress }) => progress && progress.remaining > 0)
        .sort((a, b) => a.progress.lastDate.localeCompare(b.progress.lastDate)),
    [scheduled]
  )

  if (!scheduled.some((s) => s.is_active === true)) return null

  const totals = months.reduce(
    (sum, m) => ({ income: sum.income + m.income, expenses: sum.expenses + m.expenses, net: sum.net + m.net }),
    { income: 0, expenses: 0, net: 0 }
  )

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg">Próximos 12 meses · programados</h3>
        <p className="text-xs text-charcoal-500">
          Solo tus ingresos y gastos programados, por mes calendario. El mes en curso incluye lo que ya ocurrió. No
          incluye transacciones registradas a mano.
        </p>
      </div>

      {commitments.length > 0 && (
        <div className="bg-cream-50 border border-bronze-200 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-semibold text-charcoal-700 uppercase tracking-wide">Compromisos con fin</h4>
          <ul className="divide-y divide-bronze-200">
            {commitments.map(({ s, progress }) => {
              const frees = toMonthlyAmount(s.amount, s.frequency)
              return (
                <li key={s.id} className="py-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-sm">
                  <div className="min-w-0">
                    <p className="text-charcoal-700 font-medium truncate">{s.description}</p>
                    <p className="text-xs text-charcoal-500">
                      {progress.paid} de {progress.total} pagos · último pago {dayLabel(progress.lastDate)}
                    </p>
                  </div>
                  <div className="text-right tabular">
                    <p className={s.type === 'income' ? 'text-forest-700' : 'text-burgundy-700'}>
                      Restan {money(progress.remainingAmount)}
                    </p>
                    <p className="text-xs text-charcoal-500">
                      Al terminar, {s.type === 'income' ? 'tu ingreso baja' : 'tu margen sube'} ≈ {money(frees)} al mes
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="bg-cream-50 border border-bronze-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs sm:text-sm tabular">
          <thead className="bg-cream-100 text-xs text-charcoal-500 uppercase tracking-wide">
            <tr>
              <th className="px-2 sm:px-3 py-2 text-left font-medium">Mes</th>
              <th className="px-2 sm:px-3 py-2 text-right font-medium">Ingresos</th>
              <th className="px-2 sm:px-3 py-2 text-right font-medium">Gastos</th>
              <th className="px-2 sm:px-3 py-2 text-right font-medium">Neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bronze-200">
            {months.map((m) => (
              <tr key={m.month}>
                <td className="px-2 sm:px-3 py-2 text-charcoal-700">
                  <span className="capitalize">{monthLabel(m.month)}</span>
                  {m.endings.length > 0 && (
                    <span className="block text-xs text-gold-700">Termina: {m.endings.join(', ')}</span>
                  )}
                </td>
                <td className="px-2 sm:px-3 py-2 text-right text-forest-700">{money0(m.income)}</td>
                <td className="px-2 sm:px-3 py-2 text-right text-burgundy-700">{money0(m.expenses)}</td>
                <td className={`px-2 sm:px-3 py-2 text-right font-medium ${m.net >= 0 ? 'text-forest-700' : 'text-burgundy-700'}`}>
                  {money0(m.net)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-cream-100 font-semibold text-charcoal-700">
            <tr>
              <td className="px-2 sm:px-3 py-2">12 meses</td>
              <td className="px-2 sm:px-3 py-2 text-right">{money0(totals.income)}</td>
              <td className="px-2 sm:px-3 py-2 text-right">{money0(totals.expenses)}</td>
              <td className={`px-2 sm:px-3 py-2 text-right ${totals.net >= 0 ? 'text-forest-700' : 'text-burgundy-700'}`}>{money0(totals.net)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
