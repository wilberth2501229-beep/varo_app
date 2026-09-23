import { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import * as authService from '../../services/authService'
import Modal from './Modal'

export default function ShareAccount({ account, isOpen, onClose, onShared }) {
  const { showSuccess, showError } = useUiStore()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleShare = async (e) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      showError('Por favor ingresa un email válido')
      return
    }

    setLoading(true)

    try {
      const result = await authService.shareAccountWithEmail(account.id, email)

      if (result.success) {
        showSuccess(`✅ Cuenta compartida con ${email}`)
        setEmail('')
        onClose()
        onShared?.()
      } else {
        showError(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      showError(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnshare = async () => {
    if (!confirm('¿Dejar de compartir esta cuenta?')) return

    setLoading(true)

    try {
      const result = await authService.unshareAccount(account.id)

      if (result.success) {
        showSuccess('✅ Cuenta no compartida')
        onClose()
        onShared?.()
      } else {
        showError(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      showError(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👥 Compartir Cuenta">
      <div className="space-y-4">
        <p className="text-gray-700 text-sm">
          Comparte esta cuenta con tu pareja para que ambos vean las mismas transacciones.
        </p>

        {account?.shared_with_email ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 mb-3">
              ✅ Cuenta compartida con: <strong>{account.shared_with_email}</strong>
            </p>
            <button
              onClick={handleUnshare}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {loading ? '⏳ Cancelando...' : '🚫 Dejar de Compartir'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleShare} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Email de tu pareja
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pareja@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {loading ? '⏳ Compartiendo...' : '✅ Compartir Cuenta'}
            </button>
          </form>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Tu pareja recibirá acceso automáticamente cuando inicie sesión con este email.
          </p>
        </div>
      </div>
    </Modal>
  )
}
