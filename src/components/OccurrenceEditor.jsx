import { useCallback, useState } from 'react'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { setOccurrenceOverride } from '../services/scheduledTransactionService'
import { toLocalISODate } from '../services/cashFlowService'
import { formatCurrency } from '../utils/utils'

const money = (n) => formatCurrency(n, 'MXN')
const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

// Ajusta un solo pago programado (fecha y monto reales); el resto de la serie no se mueve
export default function OccurrenceEditor({ occurrence, onClose, onSaved }) {
  const scheduled = useScheduledTransactionStore((state) =>
    state.scheduledTransactions.find((s) => s.id === occurrence.scheduledId)
  )
  const updateStore = useScheduledTransactionStore((state) => state.updateScheduledTransaction)

  const [date, setDate] = useState(occurrence.date)
  const [amount, setAmount] = useState(String(occurrence.amount))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const scrollIntoView = useCallback((node) => node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), [])

  const todayISO = toLocalISODate(new Date())
  const isIncome = occurrence.type === 'income'

  const save = async (change) => {
    if (!scheduled) {
      setError('No encontré esta transacción programada. Recarga la página e intenta de nuevo')
      return
    }
    if (change && (!change.date || !(Number(change.amount) > 0))) {
      setError('Indica una fecha y un monto mayor a 0')
      return
    }
    setSaving(true)
    setError('')
    const previous = scheduled.overrides?.[occurrence.originalDate] ?? null
    const result = await setOccurrenceOverride(scheduled, occurrence.originalDate, change)
    setSaving(false)
    if (!result.success) {
      setError(`No se pudo guardar: ${result.error}`)
      return
    }
    updateStore(scheduled.id, { overrides: result.overrides })
    onSaved({ scheduledId: scheduled.id, originalDate: occurrence.originalDate, previous, change })
  }

  return (
    <form
      ref={scrollIntoView}
      onSubmit={(e) => {
        e.preventDefault()
        save({ date, amount: Number(amount) })
      }}
      className="border border-gold-500 bg-cream-100 rounded-lg p-4 space-y-3"
    >
      <div>
        <h3 className="text-base font-semibold text-charcoal-700">Ajustar un pago de «{occurrence.description}»</h3>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Pago programado del {shortDate(occurrence.originalDate)} por {money(occurrence.baseAmount)}. Solo cambia este
          pago; los demás de la serie siguen igual.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-charcoal-700 mb-1">
            Fecha real {isIncome ? 'en que llegó' : 'del pago'}
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-bronze-300 rounded-lg bg-white"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-charcoal-700 mb-1">Monto real</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            required
            className="w-full px-3 py-2 border border-bronze-300 rounded-lg bg-white"
          />
        </label>
      </div>

      {date && date <= todayISO && (
        <p className="text-xs text-charcoal-600">Como esa fecha ya pasó, el pago cuenta en tu saldo de hoy.</p>
      )}
      {error && <p className="text-sm text-burgundy-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-gold-500 text-cream-50 font-medium disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar ajuste'}
        </button>
        {occurrence.adjusted && (
          <button
            type="button"
            onClick={() => save(null)}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-bronze-300 text-charcoal-600 hover:bg-cream-200 disabled:opacity-50"
          >
            Volver al original
          </button>
        )}
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-charcoal-600 hover:bg-cream-200">
          Cancelar
        </button>
      </div>
    </form>
  )
}
