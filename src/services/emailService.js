/**
 * Email Service - Integración con Resend para notificaciones por email
 *
 * Nota: Para usar este servicio necesitas:
 * 1. Instalar: npm install resend
 * 2. Agregar VITE_RESEND_API_KEY a .env.local
 * 3. Crear una función serverless en /api/send-email.js
 */

export async function sendCriticalLiquidityAlert(email, accountName, projectedBalance, criticalDate) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '⚠️ Alerta de Liquidez Crítica - Varo',
        template: 'critical_liquidity',
        data: {
          accountName,
          projectedBalance: projectedBalance.toFixed(2),
          criticalDate,
        },
      }),
    })

    if (!response.ok) throw new Error('Error enviando email')

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendScheduledTransactionAlert(
  email,
  accountName,
  transactionType,
  description,
  amount,
  dueDate
) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `📅 ${transactionType === 'income' ? 'Ingreso' : 'Gasto'} Próximo - Varo`,
        template: 'scheduled_transaction',
        data: {
          accountName,
          transactionType: transactionType === 'income' ? 'Ingreso' : 'Gasto',
          description,
          amount: amount.toFixed(2),
          dueDate,
        },
      }),
    })

    if (!response.ok) throw new Error('Error enviando email')

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendWeeklySummary(email, accountName, weekData) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '📊 Resumen Semanal de Flujo de Caja - Varo',
        template: 'weekly_summary',
        data: {
          accountName,
          ...weekData,
        },
      }),
    })

    if (!response.ok) throw new Error('Error enviando email')

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendDailyNotification(email, accountName, notificationData) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: '📬 Notificaciones del día - Varo',
        template: 'daily_digest',
        data: {
          accountName,
          ...notificationData,
        },
      }),
    })

    if (!response.ok) throw new Error('Error enviando email')

    return { success: true, data: await response.json() }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: error.message }
  }
}
