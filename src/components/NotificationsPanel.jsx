import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { getNotificationHistory, markNotificationAsRead } from '../services/notificationService'

export default function NotificationsPanel() {
  const { selectedAccountId } = useAuthStore()
  const { notifications, setNotifications, markAsRead } = useNotificationStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedAccountId) return

    const loadNotifications = async () => {
      setLoading(true)
      const result = await getNotificationHistory(selectedAccountId, 10)
      if (result.success) {
        setNotifications(result.data)
      }
      setLoading(false)
    }

    loadNotifications()
  }, [selectedAccountId, setNotifications])

  const handleMarkAsRead = async (notificationId) => {
    const result = await markNotificationAsRead(notificationId)
    if (result.success) {
      markAsRead(notificationId)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical_liquidity':
        return '⚠️'
      case 'scheduled_transaction':
        return '📅'
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'critical_liquidity':
        return 'border-red-500 bg-red-50'
      case 'scheduled_transaction':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  if (loading) {
    return <div className="bg-white rounded-lg shadow p-6 text-center">Cargando notificaciones...</div>
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Sin notificaciones
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Notificaciones ({notifications.length})</h2>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`border-l-4 rounded p-4 ${getNotificationColor(notification.type)} ${
              notification.is_read ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <h3 className="font-semibold">{notification.title}</h3>
                </div>
                <p className="text-sm text-gray-700">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>

              {!notification.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="ml-4 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                >
                  Marcar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
