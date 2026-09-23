import { create } from 'zustand'

/**
 * Store para manejar notificaciones
 */
export const useNotificationStore = create((set, get) => ({
  // Estado
  notifications: [],
  unreadCount: 0,

  // Acciones
  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  }),

  addNotification: (notification) => set((state) => {
    const newNotifications = [notification, ...state.notifications]
    return {
      notifications: newNotifications,
      unreadCount: newNotifications.filter((n) => !n.is_read).length,
    }
  }),

  markAsRead: (notificationId) => set((state) => {
    const updated = state.notifications.map((n) =>
      n.id === notificationId ? { ...n, is_read: true } : n
    )
    return {
      notifications: updated,
      unreadCount: updated.filter((n) => !n.is_read).length,
    }
  }),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    unreadCount: 0,
  })),

  deleteNotification: (notificationId) => set((state) => {
    const updated = state.notifications.filter((n) => n.id !== notificationId)
    return {
      notifications: updated,
      unreadCount: updated.filter((n) => !n.is_read).length,
    }
  }),

  clearAll: () => set({
    notifications: [],
    unreadCount: 0,
  }),

  // Getters
  getUnreadNotifications: () => {
    return get().notifications.filter((n) => !n.is_read)
  },

  getNotificationsByType: (type) => {
    return get().notifications.filter((n) => n.type === type)
  },

  getCriticalLiquidityAlerts: () => {
    return get().notifications.filter((n) => n.type === 'critical_liquidity')
  },

  getScheduledTransactionAlerts: () => {
    return get().notifications.filter((n) => n.type === 'scheduled_transaction')
  },
}))
