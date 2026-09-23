import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * ALERTAS DE PRESUPUESTO - Todos los métodos para manejar presupuestos y alertas
 */

// ============================================
// BUDGET ALERTS (Presupuestos)
// ============================================

// Obtener todos los presupuestos de una cuenta
export async function getBudgetAlerts(accountId) {
  try {
    const { data, error } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Presupuestos obtenidos')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener un presupuesto específico
export async function getBudgetAlert(budgetAlertId) {
  try {
    const { data, error } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('id', budgetAlertId)
      .single()

    if (error) throw error

    logSupabaseData(data, 'Presupuesto obtenido')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Crear nuevo presupuesto
export async function createBudgetAlert(budgetData) {
  try {
    const { data, error } = await supabase
      .from('budget_alerts')
      .insert([budgetData])
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Presupuesto creado')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Actualizar presupuesto
export async function updateBudgetAlert(budgetAlertId, updates) {
  try {
    const { data, error } = await supabase
      .from('budget_alerts')
      .update(updates)
      .eq('id', budgetAlertId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Presupuesto actualizado')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Eliminar presupuesto (soft delete)
export async function deleteBudgetAlert(budgetAlertId) {
  try {
    const { data, error } = await supabase
      .from('budget_alerts')
      .update({ is_active: false })
      .eq('id', budgetAlertId)
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Presupuesto desactivado')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// ============================================
// ALERT LOGS (Registro de alertas disparadas)
// ============================================

// Obtener todas las alertas disparadas
export async function getAlertLogs(accountId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('alert_logs')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, `Alertas de últimos ${days} días`)
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener alertas críticas
export async function getCriticalAlerts(accountId, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('alert_logs')
      .select('*')
      .eq('account_id', accountId)
      .eq('alert_type', 'critical')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Alertas críticas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener alertas recientes (últimas 24 horas)
export async function getRecentAlerts(accountId) {
  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data, error } = await supabase
      .from('alert_logs')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, 'Alertas recientes (últimas 24h)')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener alertas por categoría
export async function getAlertsByCategory(accountId, category, days = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('alert_logs')
      .select(`
        *,
        budget_alerts (
          category
        )
      `)
      .eq('account_id', accountId)
      .eq('budget_alerts.category', category)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    logSupabaseData(data, `Alertas de ${category}`)
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener gasto actual vs presupuesto de una categoría
export async function getCategorySpendingStatus(accountId, category) {
  try {
    // Obtener presupuesto
    const { data: budget, error: budgetError } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('account_id', accountId)
      .eq('category', category)
      .eq('is_active', true)
      .single()

    if (budgetError) {
      return {
        success: false,
        error: 'No hay presupuesto configurado para esta categoría',
      }
    }

    // Obtener gasto del mes actual
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('account_id', accountId)
      .eq('type', 'expense')
      .eq('category', category)
      .gte('transaction_date', monthStart.toISOString().split('T')[0])
      .lte('transaction_date', monthEnd.toISOString().split('T')[0])

    if (transError) throw transError

    const spent = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    const remaining = budget.monthly_limit - spent
    const percentage = (spent / budget.monthly_limit) * 100

    const status = {
      category,
      spent,
      limit: budget.monthly_limit,
      remaining,
      percentage,
      isExceeded: spent > budget.monthly_limit,
      isCritical: percentage >= 100,
      isWarning: percentage >= budget.alert_threshold,
      monthStart: monthStart.toISOString().split('T')[0],
      monthEnd: monthEnd.toISOString().split('T')[0],
    }

    logSupabaseData(status, `Estado de gasto de ${category}`)
    return { success: true, data: status }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener resumen de presupuestos
export async function getBudgetSummary(accountId) {
  try {
    const { data: budgets, error } = await supabase
      .from('budget_alerts')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)

    if (error) throw error

    // Para cada presupuesto, obtener el gasto actual
    const summaries = await Promise.all(
      budgets.map(async (budget) => {
        const result = await getCategorySpendingStatus(accountId, budget.category)
        return result.success ? result.data : null
      })
    )

    logSupabaseData(summaries, 'Resumen de presupuestos')
    return { success: true, data: summaries.filter(Boolean) }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
