import { useState } from 'react'
import { useUiStore } from '../../store/uiStore'
import * as authService from '../../services/authService'

export default function SignupPage({ onSwitchToLogin }) {
  const { showSuccess, showError } = useUiStore()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('Por favor completa todos los campos')
      return false
    }

    if (formData.password.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Las contraseñas no coinciden')
      return false
    }

    if (!formData.email.includes('@')) {
      showError('Por favor ingresa un email válido')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // Registrar usuario
      const signupResult = await authService.signUp(
        formData.email,
        formData.password,
        formData.fullName
      )

      if (!signupResult.success) {
        showError(`❌ Error al registrar: ${signupResult.error}`)
        setLoading(false)
        return
      }

      // Crear cuenta de usuario
      const accountResult = await authService.createUserAccount(
        signupResult.data.id,
        `Cuenta de ${formData.fullName}`
      )

      if (accountResult.success) {
        showSuccess('✅ ¡Cuenta creada! Por favor verifica tu email para confirmar')
        // Limpiar formulario
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        })
        // Cambiar a login después de 2 segundos
        setTimeout(() => {
          onSwitchToLogin()
        }, 2000)
      } else {
        showError(`⚠️ Usuario creado pero hubo error al crear la cuenta: ${accountResult.error}`)
      }
    } catch (error) {
      showError(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💰 Varo</h1>
          <p className="text-gray-600">Crea tu cuenta para comenzar</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👤 Nombre Completo
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Confirmar Contraseña
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition mt-6"
          >
            {loading ? '⏳ Creando cuenta...' : '✨ Crear Cuenta'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">o</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-gray-600 mb-2">¿Ya tienes cuenta?</p>
          <button
            onClick={onSwitchToLogin}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
          >
            🚀 Iniciar Sesión
          </button>
        </div>

        {/* Terms */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            Al crear una cuenta, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
