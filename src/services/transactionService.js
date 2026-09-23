import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * TRANSACCIONES - Todos los métodos para manejar transacciones
 */

// Obtener todas las transacciones de una cuenta
export async function getTransactions(accountId) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('transaction_date', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Transacciones obtenidas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener transacciones en un rango de fechas
export async function getTransactionsByDateRange(accountId, startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Transacciones en rango')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener transacciones por categoría
export async function getTransactionsByCategory(accountId, category, type = null) {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('category', category)

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query.order('transaction_date', { ascending: false })

    if (error) throw error

    logSupabaseData(data, `Transacciones de ${category}`)
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener resumen mensual
export async function getMonthlyTransactionSummary(accountId) {
  try {
    const { data, error } = await supabase
      .from('transaction_summary_monthly')
      .select('*')
      .eq('account_id', accountId)

    if (error) throw error

    logSupabaseData(data, 'Resumen mensual')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener resumen semanal
export async function getWeeklyTransactionSummary(accountId) {
  try {
    const { data, error } = await supabase
      .from('transaction_summary_weekly')
      .select('*')
      .eq('account_id', accountId)

    if (error) throw error

    logSupabaseData(data, 'Resumen semanal')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener resumen diario
export async function getDailyTransactionSummary(accountId) {
  try {
    const { data, error } = await supabase
      .from('transaction_summary_daily')
      .select('*')
      .eq('account_id', accountId)

    if (error) throw error

    logSupabaseData(data, 'Resumen diario')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Crear nueva transacción
export async function createTransaction(transaction) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Transacción creada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Actualizar transacción
export async function updateTransaction(id, updates) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Transacción actualizada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Eliminar transacción
export async function deleteTransaction(id) {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error

    logSupabaseData(null, 'Transacción eliminada')
    return { success: true }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener una transacción específica
export async function getTransaction(id) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    logSupabaseData(data, 'Transacción obtenida')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
