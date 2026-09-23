import { useState } from 'react'
import { useTransactionStore } from '../../store/transactionStore'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'
import * as transactionService from '../../services/transactionService'

const CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Servicios',
  'Salud',
  'Educación',
  'Otros'
]

export default function TransactionForm({ onClose }) {
  const { addTransaction } = useTransactionStore()
  const { showSuccess, showError } = useUiStore()
  const { selectedAccountId } = useAuthStore()

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Otros',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    try {
      // UUID de la cuenta de prueba si no hay cuenta seleccionada
      const TEST_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000'
      const accountId = selectedAccountId || TEST_ACCOUNT_ID

      const newTransaction = {
        ...formData,
        amount: parseFloat(formData.amount),
        account_id: accountId
      }

      // Llamar al servicio para guardar en Supabase
      const result = await transactionService.createTransaction(newTransaction)

      if (result.success && result.data) {
        // Actualizar el store local
        addTransaction(result.data)
        showSuccess('✅ Transacción guardada exitosamente')
      } else {
        showError(`❌ Error: ${result.error || 'Error desconocido'}`)
        setLoading(false)
        return
      }

      // Limpiar formulario
      setFormData({
        type: 'expense',
        amount: '',
        category: 'Otros',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0]
      })

      // Cerrar modal
      onClose?.()
    } catch (error) {
      showError(`❌ Error: ${error.message}`)
      console.error('Error creating transaction:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-green-600 font-medium">📈 Ingreso</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-red-600 font-medium">📉 Egreso</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto
          </label>
          <input
            type="number"
            name="amount"
            placeholder="0.00"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <input
          type="text"
          name="description"
          placeholder="Ej: Compra en supermercado"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha
        </label>
        <input
          type="date"
          name="transaction_date"
          value={formData.transaction_date}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          {loading ? '⏳ Guardando...' : '💾 Guardar'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
        >
          ✖️ Cancelar
        </button>
      </div>
    </form>
  )
}
