import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import * as authService from '../../services/authService'

export default function LoginPage({ onSwitchToSignup }) {
  const { setUser, setSession } = useAuthStore()
  const { showSuccess, showError } = useUiStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      showError('Por favor completa todos los campos')
      return
    }

    setLoading(true)

    try {
      const result = await authService.signIn(email, password)

      if (result.success) {
        setUser(result.data)
        setSession(result.session)
        showSuccess('✅ ¡Bienvenido de vuelta!')
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Varo</h1>
          <p className="text-gray-600">Gestiona tus finanzas personales</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition mt-6"
          >
            {loading ? '⏳ Iniciando sesión...' : '🚀 Iniciar Sesión'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">o</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">¿No tienes cuenta?</p>
          <button
            onClick={onSwitchToSignup}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
          >
            📝 Crear Cuenta
          </button>
        </div>

        {/* Test Account Info */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Cuenta de prueba:</strong><br/>
            Email: <code className="bg-yellow-100 px-1">test@varo.com</code><br/>
            Pass: <code className="bg-yellow-100 px-1">Test123456!</code>
          </p>
        </div>
      </div>
    </div>
  )
}
