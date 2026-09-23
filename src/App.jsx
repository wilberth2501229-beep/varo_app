import { useEffect, useState } from 'react'
import { useUiStore } from './store/uiStore'
import { useTransactionStore } from './store/transactionStore'
import { useAuthStore } from './store/authStore'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import BalanceCard from './components/Analytics/BalanceCard'
import TransactionForm from './components/Transactions/TransactionForm'
import TransactionList from './components/Transactions/TransactionList'
import SpendingChart from './components/Analytics/SpendingChart'
import Modal from './components/Common/Modal'
import AlertBadge from './components/Common/AlertBadge'
import Notification from './components/Common/Notification'
import Spinner from './components/Common/Spinner'
import AuthLayout from './components/Auth/AuthLayout'
import AccountSettings from './components/Settings/AccountSettings'
import CashFlow from './pages/CashFlow'
import * as transactionService from './services/transactionService'
import * as authService from './services/authService'
import './App.css'

function App() {
  const { isFormModalOpen, openFormModal, closeFormModal, activeTab, isLoading } = useUiStore()
  const { setTransactions } = useTransactionStore()
  const { user, setUser, setSession, setUserAccounts, setSelectedAccountId, clearAuth } = useAuthStore()
  const [initializing, setInitializing] = useState(true)

  // Verificar autenticación al montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionResult = await authService.getCurrentSession()
        const userResult = await authService.getCurrentUser()

        if (sessionResult.success && sessionResult.data) {
          setSession(sessionResult.data)
          setUser(userResult.data)

          // Cargar cuentas del usuario (propias + compartidas)
          if (userResult.data) {
            const accountsResult = await authService.getUserAccounts(
              userResult.data.id,
              userResult.data.email
            )
            if (accountsResult.success && accountsResult.data.length > 0) {
              setUserAccounts(accountsResult.data)
              setSelectedAccountId(accountsResult.data[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setInitializing(false)
      }
    }

    checkAuth()
  }, [setUser, setSession, setUserAccounts, setSelectedAccountId])

  // Cargar transacciones cuando hay usuario y cuenta seleccionada
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // UUID de la cuenta de prueba (si no hay cuentas de usuario)
        const TEST_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000'

        const userAccounts = useAuthStore.getState().userAccounts
        const selectedAccount = userAccounts.length > 0
          ? (useAuthStore.getState().selectedAccountId || userAccounts[0].id)
          : TEST_ACCOUNT_ID

        const result = await transactionService.getTransactions(selectedAccount)
        if (result.success) {
          setTransactions(result.data || [])
        }
      } catch (error) {
        console.error('Error loading transactions:', error)
      }
    }

    if (!initializing) {
      loadTransactions()
    }
  }, [initializing, setTransactions])

  const renderContent = () => {
    if (isLoading) {
      return <Spinner message="Cargando datos..." />
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <AlertBadge />
            <BalanceCard />
            <SpendingChart />
          </div>
        )
      case 'transactions':
        return <TransactionList />
      case 'cashflow':
        return <CashFlow />
      case 'budgets':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-500 text-lg">Presupuestos - Próximamente 🔜</p>
          </div>
        )
      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <p className="text-gray-500 text-lg">Análisis avanzado - Próximamente 🔜</p>
          </div>
        )
      case 'settings':
        return <AccountSettings />
      default:
        return null
    }
  }

  const handleLogout = async () => {
    const result = await authService.signOut()
    if (result.success) {
      clearAuth()
    }
  }

  // Mostrar pantalla de carga mientras se verifica autenticación
  if (initializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner message="Iniciando Varo..." />
      </div>
    )
  }

  // Mostrar login/signup si no está autenticado
  if (!user) {
    return <AuthLayout />
  }

  // Mostrar dashboard si está autenticado
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="flex">
        <Sidebar onLogout={handleLogout} />

        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>

      {/* Modal para agregar transacción */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title="➕ Nueva Transacción"
      >
        <TransactionForm onClose={closeFormModal} />
      </Modal>

      {/* Botón flotante para agregar transacción */}
      <button
        onClick={openFormModal}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-110"
        title="Agregar transacción"
      >
        <span className="text-2xl">➕</span>
      </button>

      {/* Notificaciones */}
      <Notification />
    </div>
  )
}

export default App
