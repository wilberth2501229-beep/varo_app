import { useEffect, useState } from 'react'
import { useUiStore } from '../../store/uiStore'

export default function Notification() {
  const { notification, clearNotification } = useUiStore()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (notification) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => clearNotification(), 300)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [notification, clearNotification])

  if (!notification || !visible) return null

  const isSuccess = notification.type === 'success'
  const bgColor = isSuccess ? 'bg-green-50' : 'bg-red-50'
  const borderColor = isSuccess ? 'border-green-400' : 'border-red-400'
  const textColor = isSuccess ? 'text-green-800' : 'text-red-800'

  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bgColor} border-l-4 ${borderColor} p-4 rounded shadow-lg transition-opacity duration-300 max-w-md ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex justify-between items-start">
        <p className={`text-sm font-medium ${textColor}`}>
          {notification.message}
        </p>
        <button
          onClick={() => setVisible(false)}
          className={`${isSuccess ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'} transition`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
