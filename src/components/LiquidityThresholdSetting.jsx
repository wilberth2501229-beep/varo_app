import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { getLiquidityThreshold, updateLiquidityThreshold } from '../services/cashFlowService'

export default function LiquidityThresholdSetting() {
  const { selectedAccountId } = useAuthStore()
  const { setLiquidityThreshold: setThresholdInStore } = useScheduledTransactionStore()

  const [threshold, setThreshold] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    critical_balance: 0,
    alert_days_before: 14,
  })

  useEffect(() => {
    if (!selectedAccountId) return

    const loadThreshold = async () => {
      setLoading(true)
      const result = await getLiquidityThreshold(selectedAccountId)
      if (result.success) {
        setThreshold(result.data)
        setForm({
          critical_balance: result.data.critical_balance || 0,
          alert_days_before: result.data.alert_days_before || 14,
        })
      }
      setLoading(false)
    }

    loadThreshold()
  }, [selectedAccountId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({
      ...form,
      [name]: name === 'critical_balance' ? parseFloat(value) : parseInt(value),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateLiquidityThreshold(
        selectedAccountId,
        form.critical_balance,
        form.alert_days_before
      )

      if (!result.success) throw new Error(result.error)

      setThresholdInStore(form.critical_balance, form.alert_days_before)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 text-center">Cargando configuración...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">⚙️ Configuración de Liquidez</h2>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">✅ Guardado correctamente</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Saldo Crítico */}
        <div>
          <label className="block text-sm font-semibold mb-2">Saldo Crítico</label>
          <p className="text-xs text-gray-500 mb-2">
            El sistema alertará cuando el saldo proyectado caiga por debajo de este monto
          </p>
          <input
            type="number"
            name="critical_balance"
            value={form.critical_balance}
            onChange={handleChange}
            step="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
          <p className="text-xs text-gray-600 mt-1">
            Valor actual: <span className="font-bold">${form.critical_balance.toFixed(2)}</span>
          </p>
        </div>

        {/* Días de anticipación */}
        <div>
          <label className="block text-sm font-semibold mb-2">Días de Anticipación para Alertas</label>
          <p className="text-xs text-gray-500 mb-2">
            Cuántos días antes de llegar al saldo crítico se debe avisar
          </p>
          <input
            type="number"
            name="alert_days_before"
            value={form.alert_days_before}
            onChange={handleChange}
            min="1"
            max="90"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-600 mt-1">
            Se alertará con <span className="font-bold">{form.alert_days_before} días</span> de anticipación
          </p>
        </div>

        {/* Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📊 Resumen de Configuración</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Alerta crítica: cuando saldo &lt; ${form.critical_balance.toFixed(2)}</li>
            <li>• Notificación anticipada: {form.alert_days_before} días antes</li>
            <li>• Notificaciones automáticas activadas</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  )
}
