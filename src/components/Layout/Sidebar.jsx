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
    <aside className="bg-forest-700 text-cream-100 w-64 min-h-screen flex flex-col">
      {/* Logo y Navegación */}
      <div className="p-6 flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-8 text-cream-100">Varo</h2>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-gold-500 text-cream-50 font-semibold'
                  : 'text-cream-200 hover:bg-forest-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Botón Logout - al final del sidebar */}
      <div className="p-6 border-t border-forest-600">
        <button
          onClick={onLogout}
          className="w-full bg-burgundy-700 hover:bg-burgundy-600 text-cream-50 font-semibold py-2 px-4 rounded-lg transition"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
