import { useState } from 'react'
import { useTransactionStore } from '../../store/transactionStore'
import { useUiStore } from '../../store/uiStore'
import { formatCurrency, formatDate, getTransactionColor } from '../../utils/utils'
import * as transactionService from '../../services/transactionService'

const CATEGORIES = [
  'Todos',
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Servicios',
  'Salud',
  'Educación',
  'Otros'
]

export default function TransactionList() {
  const { transactions, deleteTransaction } = useTransactionStore()
  const { showSuccess, showError } = useUiStore()

  const [filters, setFilters] = useState({
    category: 'Todos',
    type: 'all' // 'all', 'income', 'expense'
  })

  const [sortBy, setSortBy] = useState('date-desc')

  const filteredTransactions = transactions
    .filter(t => filters.category === 'Todos' || t.category === filters.category)
    .filter(t => filters.type === 'all' || t.type === filters.type)
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.transaction_date) - new Date(a.transaction_date)
      if (sortBy === 'date-asc') return new Date(a.transaction_date) - new Date(b.transaction_date)
      if (sortBy === 'amount-desc') return b.amount - a.amount
      if (sortBy === 'amount-asc') return a.amount - b.amount
      return 0
    })

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return

    try {
      const result = await transactionService.deleteTransaction(id)
      if (result.success) {
        deleteTransaction(id)
        showSuccess('✅ Transacción eliminada')
      } else {
        showError(`❌ Error: ${result.error || 'Error desconocido'}`)
      }
    } catch (error) {
      showError(`❌ Error: ${error.message}`)
      console.error('Error deleting transaction:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">📋 Historial de Transacciones</h2>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="income">📈 Ingresos</option>
              <option value="expense">📉 Egresos</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date-desc">Fecha (Nuevas primero)</option>
              <option value="date-asc">Fecha (Viejas primero)</option>
              <option value="amount-desc">Monto (Mayor)</option>
              <option value="amount-asc">Monto (Menor)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              &nbsp;
            </label>
            <div className="text-sm text-gray-600 py-2">
              Total: {filteredTransactions.length} transacciones
            </div>
          </div>
        </div>
      </div>

      {/* Lista de transacciones */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay transacciones</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Descripción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Categoría</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Monto</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {transaction.description || '(Sin descripción)'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transaction.category}
                  </td>
                  <td className={`px-6 py-4 text-sm font-semibold text-right ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, 'MXN')}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      className="text-red-600 hover:text-red-800 font-medium transition"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
