import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { createScheduledTransaction, updateScheduledTransaction } from '../services/scheduledTransactionService'

const FREQUENCIES = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Cada 2 semanas' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
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
      next_due_date: new Date().toISOString().split('T')[0],
      is_active: true,
    }
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
      const payload = {
        ...form,
        account_id: selectedAccountId,
        amount: parseFloat(form.amount),
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
            next_due_date: new Date().toISOString().split('T')[0],
            is_active: true,
          })
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
            <label className="block text-sm font-medium mb-1">Próxima fecha</label>
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
