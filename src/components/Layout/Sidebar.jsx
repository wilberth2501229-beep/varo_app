import { useUiStore } from '../../store/uiStore'

export default function Sidebar({ onLogout }) {
  const { activeTab, setActiveTab } = useUiStore()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'transactions', label: 'Transacciones', icon: '💳' },
    { id: 'cashflow', label: 'Flujo de Caja', icon: '💰' },
    { id: 'budgets', label: 'Presupuestos', icon: '💼' },
    { id: 'analytics', label: 'Análisis', icon: '📈' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
  ]

  return (
    <aside className="bg-gray-900 text-white w-64 min-h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-8">Varo</h2>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        <button
          onClick={onLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          🚪 Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
