import { create } from 'zustand'

/**
 * Store global para manejar estado de UI
 * Modales, loading states, notificaciones, etc.
 */
export const useUiStore = create((set, get) => ({
  // Estado - Modales
  isFormModalOpen: false,
  isDeleteModalOpen: false,
  isBudgetModalOpen: false,
  selectedTransactionForEdit: null,

  // Estado - Loading
  isLoading: false,
  loadingMessage: '',

  // Estado - Notificaciones
  notification: null,

  // Estado - Navegación
  activeTab: 'dashboard',

  // Acciones - Modales
  openFormModal: (transactionToEdit = null) => set({
    isFormModalOpen: true,
    selectedTransactionForEdit: transactionToEdit,
  }),
  
  closeFormModal: () => set({
    isFormModalOpen: false,
    selectedTransactionForEdit: null,
  }),

  openDeleteModal: (transaction) => set({
    isDeleteModalOpen: true,
    selectedTransactionForEdit: transaction,
  }),
  
  closeDeleteModal: () => set({
    isDeleteModalOpen: false,
    selectedTransactionForEdit: null,
  }),

  openBudgetModal: () => set({ isBudgetModalOpen: true }),
  closeBudgetModal: () => set({ isBudgetModalOpen: false }),

  // Acciones - Loading
  setLoading: (isLoading, message = '') => set({
    isLoading,
    loadingMessage: message,
  }),

  // Acciones - Notificaciones
  showNotification: (message, type = 'success', duration = 3000) => {
    set({
      notification: {
        id: Date.now(),
        message,
        type, // 'success', 'error', 'warning', 'info'
      },
    })

    // Auto-dismiss después del tiempo especificado
    setTimeout(() => {
      set({ notification: null })
    }, duration)
  },

  dismissNotification: () => set({ notification: null }),

  // Helpers para notificaciones comunes
  showSuccess: (message) => get().showNotification(message, 'success'),
  showError: (message) => get().showNotification(message, 'error'),
  showWarning: (message) => get().showNotification(message, 'warning'),
  showInfo: (message) => get().showNotification(message, 'info'),

  // Acciones - Navegación
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Acciones - Limpiar notificaciones
  clearNotification: () => set({ notification: null }),

  // Getters
  isAnyModalOpen: () => {
    const state = get()
    return state.isFormModalOpen || state.isDeleteModalOpen || state.isBudgetModalOpen
  },
}))
