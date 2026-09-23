import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * TRANSACCIONES PROGRAMADAS - Gestionar gastos/ingresos fijos
 */

// Obtener transacciones programadas de una cuenta
export async function getScheduledTransactions(accountId) {
  try {
    const { data, error } = await supabase
      .from('scheduled_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('next_due_date', { ascending: true })

    if (error) throw error

    logSupabaseData(data, 'Transacciones programadas obtenidas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Crear transacción programada
export async function createScheduledTransaction(transaction) {
  try {
    const { data, error } = await supabase
      .from('scheduled_transactions')
      .insert([transaction])
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Transacción programada creada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Actualizar transacción programada
export async function updateScheduledTransaction(id, updates) {
  try {
    const { data, error } = await supabase
      .from('scheduled_transactions')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Transacción programada actualizada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Eliminar transacción programada
export async function deleteScheduledTransaction(id) {
  try {
    const { error } = await supabase
      .from('scheduled_transactions')
      .delete()
      .eq('id', id)

    if (error) throw error

    logSupabaseData(null, 'Transacción programada eliminada')
    return { success: true }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener próximas transacciones programadas (próximos 30 días)
export async function getUpcomingScheduledTransactions(accountId, days = 30) {
  try {
    const today = new Date()
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('scheduled_transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .gte('next_due_date', today.toISOString().split('T')[0])
      .lte('next_due_date', futureDate.toISOString().split('T')[0])
      .order('next_due_date', { ascending: true })

    if (error) throw error

    logSupabaseData(data, `Próximas transacciones (${days} días)`)
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Activar/Desactivar transacción programada
export async function toggleScheduledTransaction(id, isActive) {
  try {
    const { data, error } = await supabase
      .from('scheduled_transactions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()

    if (error) throw error

    logSupabaseData(data[0], `Transacción programada ${isActive ? 'activada' : 'desactivada'}`)
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
