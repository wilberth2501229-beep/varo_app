import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * CUENTAS (ACCOUNTS) - Todos los métodos para manejar cuentas
 */

// Obtener todas las cuentas del usuario actual
export async function getUserAccounts() {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Cuentas obtenidas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener una cuenta específica
export async function getAccount(accountId) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (error) throw error

    logSupabaseData(data, 'Cuenta obtenida')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener el balance de una cuenta
export async function getAccountBalance(accountId) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('balance, currency')
      .eq('id', accountId)
      .single()

    if (error) throw error

    logSupabaseData(data, 'Balance obtenido')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Crear nueva cuenta
export async function createAccount(accountData) {
  try {
    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) throw new Error('Usuario no autenticado')

    const newAccount = {
      user_id: user.id,
      ...accountData,
    }

    const { data, error } = await supabase
      .from('accounts')
      .insert([newAccount])
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Cuenta creada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Actualizar cuenta
export async function updateAccount(accountId, updates) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Cuenta actualizada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Desactivar cuenta (soft delete)
export async function deactivateAccount(accountId) {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', accountId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Cuenta desactivada')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener estadísticas rápidas de una cuenta
export async function getAccountStats(accountId) {
  try {
    // Obtener la cuenta con su balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .single()

    if (accountError) throw accountError

    // Obtener totales de transacciones
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('account_id', accountId)

    if (transError) throw transError

    // Calcular totales
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const stats = {
      balance: account.balance,
      currency: account.currency,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    }

    logSupabaseData(stats, 'Estadísticas de cuenta')
    return { success: true, data: stats }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
