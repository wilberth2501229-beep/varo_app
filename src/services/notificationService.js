import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * NOTIFICACIONES - Alertas de transacciones programadas y liquidez crítica
 */

// Crear notificación
export async function createNotification(notification) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Notificación creada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener notificaciones no leídas
export async function getUnreadNotifications(accountId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Notificaciones no leídas obtenidas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Notificación marcada como leída')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener historial de notificaciones
export async function getNotificationHistory(accountId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    logSupabaseData(data, 'Historial de notificaciones obtenido')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Crear notificación de alerta de liquidez crítica
export async function createCriticalLiquidityAlert(accountId, userId, projectedBalance, criticalDate) {
  try {
    const notification = {
      account_id: accountId,
      user_id: userId,
      type: 'critical_liquidity',
      title: '⚠️ Alerta de Liquidez Crítica',
      message: `Tu saldo proyectado bajará a $${projectedBalance.toFixed(2)} el ${criticalDate}`,
      sent_at: new Date().toISOString()
    }

    return await createNotification(notification)
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Crear notificación de transacción programada próxima
export async function createScheduledTransactionAlert(accountId, userId, transaction, daysUntil) {
  try {
    const transactionType = transaction.type === 'income' ? 'Ingreso' : 'Gasto'
    const symbol = transaction.type === 'income' ? '+' : '-'

    const notification = {
      account_id: accountId,
      user_id: userId,
      type: 'scheduled_transaction',
      title: `📅 ${transactionType} Programado`,
      message: `${transactionType} de $${transaction.amount.toFixed(2)} por "${transaction.description}" en ${daysUntil} días`,
      scheduled_transaction_id: transaction.id,
      sent_at: new Date().toISOString()
    }

    return await createNotification(notification)
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Enviar notificación por email (intención - implementar con Resend/SendGrid)
export async function sendEmailNotification(email, subject, message) {
  try {
    // TODO: Implementar con Resend o SendGrid
    // Por ahora, solo registrar que se envió
    console.log(`📧 Email enviado a ${email}:`, subject, message)

    return { success: true, data: { email, subject, message } }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Verificar si ya existe notificación para una transacción programada
export async function hasScheduledTransactionNotification(scheduledTransactionId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id')
      .eq('scheduled_transaction_id', scheduledTransactionId)
      .eq('is_read', false)
      .single()

    if (error && error.code === 'PGRST116') {
      return { success: true, data: false } // No existe
    }

    if (error) throw error

    return { success: true, data: !!data } // Existe
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
