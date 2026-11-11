import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useUiStore } from '../store/uiStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import {
  getScheduledTransactions,
  deleteScheduledTransaction,
  toggleScheduledTransaction,
  updateScheduledTransaction as saveScheduledTransaction,
} from '../services/scheduledTransactionService'
import { executedScheduledTransactions, getNextOccurrence, installmentProgress, toLocalISODate } from '../services/cashFlowService'

// Sin ocurrencias por venir: terminó (por fecha de fin o porque se eliminó conservando su historial)
const hasEnded = (transaction) => getNextOccurrence(transaction) === null

function formatNextDate(transaction) {
  const next = getNextOccurrence(transaction)
  return next ? next.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Finalizado'
}

function InstallmentLine({ transaction }) {
  const progress = installmentProgress(transaction)
  if (!progress || progress.total === 0) return null
  const last = new Date(`${progress.lastDate}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <p className="text-xs text-gray-500 mt-0.5">
      {progress.paid} de {progress.total} pagos
      {progress.remaining > 0
        ? ` · restan $${progress.remainingAmount.toLocaleString('es-MX')} · último pago ${last}`
        : ' · completado'}
    </p>
  )
}

export default function ScheduledTransactionList() {
  const { selectedAccountId } = useAuthStore()
  const { showSuccess, showError } = useUiStore()
  const { scheduledTransactions, setScheduledTransactions, updateScheduledTransaction, deleteScheduledTransaction: deleteFromStore } = useScheduledTransactionStore()
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, income, expense, active, inactive

  useEffect(() => {
    if (!selectedAccountId) return

    const loadTransactions = async () => {
      setLoading(true)
      const result = await getScheduledTransactions(selectedAccountId)
      if (result.success) {
        setScheduledTransactions(result.data)
      }
      setLoading(false)
    }

    loadTransactions()
  }, [selectedAccountId, setScheduledTransactions])

  const handleToggle = async (id, currentStatus) => {
    const result = await toggleScheduledTransaction(id, !currentStatus)
    if (result.success) {
      updateScheduledTransaction(id, { is_active: !currentStatus })
    }
  }

  // Eliminar cancela lo que está por venir. Lo ya ejecutado es historial: se conserva en el balance y en Transacciones
  const handleDelete = async (transaction) => {
    const executed = executedScheduledTransactions([transaction]).length
    const message =
      executed > 0
        ? `¿Eliminar esta transacción programada?\n\nSe cancelan los movimientos por venir. Los ${executed} ya ejecutados se conservan en tu historial y en tu balance.`
        : '¿Estás seguro de que deseas eliminar esta transacción?'
    if (!window.confirm(message)) return

    if (executed === 0) {
      const result = await deleteScheduledTransaction(transaction.id)
      if (result.success) deleteFromStore(transaction.id)
      else showError(`Error: ${result.error}`)
      return
    }

    const today = toLocalISODate(new Date())
    const endDate = transaction.end_date && transaction.end_date < today ? transaction.end_date : today
    const result = await saveScheduledTransaction(transaction.id, { end_date: endDate })
    if (result.success) {
      updateScheduledTransaction(transaction.id, { end_date: endDate })
      showSuccess('Eliminada. Los movimientos ya ejecutados se conservan en tu historial')
    } else {
      showError(`Error: ${result.error}`)
    }
  }

  const getFilteredTransactions = () => {
    return scheduledTransactions.filter((t) => {
      // Las finalizadas solo se ven en su filtro: siguen contando como historial, pero ya no son programadas
      if ((filter === 'ended') !== hasEnded(t)) return false
      switch (filter) {
        case 'income':
          return t.type === 'income'
        case 'expense':
          return t.type === 'expense'
        case 'active':
          return t.is_active
        case 'inactive':
          return !t.is_active
        default:
          return true
      }
    })
  }

  const filtered = getFilteredTransactions()

  const getCategoryColor = (category) => {
    const colors = {
      Salario: 'bg-green-100 text-green-800',
      Vivienda: 'bg-blue-100 text-blue-800',
      Alimentación: 'bg-orange-100 text-orange-800',
      Transporte: 'bg-purple-100 text-purple-800',
      Utilidades: 'bg-yellow-100 text-yellow-800',
      Seguros: 'bg-red-100 text-red-800',
      Entretenimiento: 'bg-pink-100 text-pink-800',
      Otros: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors.Otros
  }

  const getFrequencyLabel = (freq) => {
    const labels = {
      weekly: 'Semanal',
      biweekly: 'Cada 2 semanas',
      semimonthly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      annual: 'Anual',
    }
    return labels[freq] || freq
  }

  if (loading) {
    return <div className="text-center py-8">Cargando transacciones...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">📅 Transacciones Programadas</h2>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'income', label: '💰 Ingresos' },
            { id: 'expense', label: '💸 Gastos' },
            { id: 'active', label: '✅ Activas' },
            { id: 'inactive', label: '⏸️ Inactivas' },
            { id: 'ended', label: '🏁 Finalizadas' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Sin transacciones programadas en esta categoría</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Descripción</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Categoría</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Frecuencia</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Próxima Fecha</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium">{transaction.description}</p>
                    <InstallmentLine transaction={transaction} />
                  </td>
                  <td className="px-4 py-3">
                    <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                      {transaction.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getFrequencyLabel(transaction.frequency)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatNextDate(transaction)}
                  </td>
                  <td className="px-4 py-3">
                    {transaction.is_active ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Activa
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        Inactiva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {!hasEnded(transaction) && (
                        <button
                          onClick={() => handleToggle(transaction.id, transaction.is_active)}
                          className={`px-2 py-1 text-xs rounded transition ${
                            transaction.is_active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {transaction.is_active ? '⏸️ Pausar' : '▶️ Reanudar'}
                        </button>
                      )}
                      {!hasEnded(transaction) && (
                        <button
                          onClick={() => handleDelete(transaction)}
                          className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs transition"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                      {hasEnded(transaction) && <span className="text-xs text-gray-400">Su historial se conserva</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen */}
      {filtered.length > 0 && (
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase">Total Ingresos</p>
            <p className="text-lg font-bold text-green-600">
              ${filtered
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Total Gastos</p>
            <p className="text-lg font-bold text-red-600">
              ${filtered
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase">Neto</p>
            <p className="text-lg font-bold text-blue-600">
              ${(
                filtered
                  .filter((t) => t.type === 'income')
                  .reduce((sum, t) => sum + t.amount, 0) -
                filtered
                  .filter((t) => t.type === 'expense')
                  .reduce((sum, t) => sum + t.amount, 0)
              ).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
