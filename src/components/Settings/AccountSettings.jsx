import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import ShareAccount from '../Common/ShareAccount'
import { formatCurrency } from '../../utils/utils'

export default function AccountSettings() {
  const { userAccounts, user } = useAuthStore()
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)

  const handleShareClick = (account) => {
    setSelectedAccount(account)
    setShareModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Perfil de Usuario */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">👤 Mi Perfil</h2>
        <div className="space-y-3">
          <div>
            <p className="text-gray-600 text-sm">Email</p>
            <p className="text-lg font-semibold text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">ID de Usuario</p>
            <p className="text-sm font-mono text-gray-600">{user?.id?.substring(0, 20)}...</p>
          </div>
        </div>
      </div>

      {/* Mis Cuentas */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">💰 Mis Cuentas</h2>

        {userAccounts.length === 0 ? (
          <p className="text-gray-500">No tienes cuentas aún</p>
        ) : (
          <div className="space-y-3">
            {userAccounts.map((account) => (
              <div key={account.id} className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{account.name}</h3>
                    {account.is_shared && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        👥 Compartida
                      </span>
                    )}
                    {account.is_owner && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        👑 Propietario
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Balance: {formatCurrency(account.balance || 0, account.currency)}
                  </p>
                  {account.shared_with_email && (
                    <p className="text-sm text-blue-600 mt-1">
                      🔗 Compartida con: {account.shared_with_email}
                    </p>
                  )}
                </div>

                {account.is_owner && (
                  <button
                    onClick={() => handleShareClick(account)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    👥 Compartir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información de Seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-2">🔒 Seguridad</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ Tu contraseña está segura en Supabase</li>
          <li>✅ Puedes compartir cuentas sin revelar credenciales</li>
          <li>✅ Cada usuario tiene su propia sesión</li>
          <li>✅ Usa "Cerrar sesión" para desconectarte</li>
        </ul>
      </div>

      {/* Modal de Compartir */}
      {selectedAccount && (
        <ShareAccount
          account={selectedAccount}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onShared={() => {
            setShareModalOpen(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
