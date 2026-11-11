import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { createScheduledTransaction, updateScheduledTransaction } from '../services/scheduledTransactionService'
import { nthOccurrenceDate, toLocalISODate } from '../services/cashFlowService'
import { formatCurrency } from '../utils/utils'

const FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'semimonthly', label: 'Quincenal (15 y fin de mes)' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
]

const CATEGORIES = [
  'Salario',
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Utilidades',
  'Seguros',
  'Entretenimiento',
  'Otros',
]

export default function TransactionScheduler({ onSuccess, editingTransaction = null }) {
  const { selectedAccountId } = useAuthStore()
  const { addScheduledTransaction, updateScheduledTransaction: updateStore } = useScheduledTransactionStore()

  const [form, setForm] = useState(
    editingTransaction || {
      description: '',
      amount: '',
      type: 'expense',
      frequency: 'monthly',
      category: 'Otros',
      next_due_date: toLocalISODate(new Date()),
      is_active: true,
    }
  )

  // Duración: recurrente sin fin, por número de pagos (p. ej. un préstamo a 8 meses) o hasta una fecha
  const [durationMode, setDurationMode] = useState(editingTransaction?.end_date ? 'date' : 'none')
  const [paymentCount, setPaymentCount] = useState('')
  const [endDate, setEndDate] = useState(editingTransaction?.end_date ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const count = Math.floor(Number(paymentCount))
  const lastPaymentISO =
    durationMode === 'count' && count >= 1 && form.next_due_date
      ? nthOccurrenceDate(form.frequency, form.next_due_date, count)
      : durationMode === 'date' && endDate
        ? endDate
        : null
  const totalToPay = durationMode === 'count' && count >= 1 && Number(form.amount) > 0 ? count * Number(form.amount) : null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const today = toLocalISODate(new Date())
      if (durationMode !== 'none' && !lastPaymentISO) throw new Error('Indica cuántos pagos o hasta qué fecha')
      if (lastPaymentISO && lastPaymentISO < form.next_due_date) {
        throw new Error('La fecha del último pago no puede ser anterior a la primera fecha')
      }

      const payload = {
        ...form,
        account_id: selectedAccountId,
        amount: parseFloat(form.amount),
        start_date: editingTransaction?.start_date || today,
        end_date: lastPaymentISO,
      }

      let result
      if (editingTransaction) {
        result = await updateScheduledTransaction(editingTransaction.id, payload)
        if (result.success) {
          updateStore(editingTransaction.id, result.data)
        }
      } else {
        result = await createScheduledTransaction(payload)
        if (result.success) {
          addScheduledTransaction(result.data)
          setForm({
            description: '',
            amount: '',
            type: 'expense',
            frequency: 'monthly',
            category: 'Otros',
            next_due_date: toLocalISODate(new Date()),
            is_active: true,
          })
          setDurationMode('none')
          setPaymentCount('')
          setEndDate('')
        }
      }

      if (!result.success) throw new Error(result.error)
      if (onSuccess) onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-4">
        {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción Programada'}
      </h2>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Pago de renta"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Monto</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              required
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Frecuencia</label>
            <select
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {FREQUENCIES.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Primera fecha</label>
            <input
              type="date"
              name="next_due_date"
              value={form.next_due_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Duración</label>
            <select
              value={durationMode}
              onChange={(e) => setDurationMode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Sin fin (recurrente)</option>
              <option value="count">Por número de pagos (p. ej. un préstamo)</option>
              <option value="date">Hasta una fecha</option>
            </select>
          </div>

          {durationMode === 'count' && (
            <div>
              <label className="block text-sm font-medium mb-1">Número de pagos</label>
              <input
                type="number"
                min="1"
                step="1"
                value={paymentCount}
                onChange={(e) => setPaymentCount(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: 8"
              />
            </div>
          )}

          {durationMode === 'date' && (
            <div>
              <label className="block text-sm font-medium mb-1">Fecha del último pago</label>
              <input
                type="date"
                min={form.next_due_date}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {durationMode === 'count' && lastPaymentISO && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            Último pago:{' '}
            <strong>
              {new Date(`${lastPaymentISO}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </strong>
            {totalToPay !== null && (
              <>
                {' '}
                · Total: <strong>{formatCurrency(totalToPay, 'MXN')}</strong>
              </>
            )}
          </p>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600"
          />
          <label className="ml-2 text-sm">Activo</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Transacción'}
        </button>
      </form>
    </div>
  )
}
