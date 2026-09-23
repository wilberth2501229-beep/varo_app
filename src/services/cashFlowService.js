import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * FLUJO DE CAJA - Proyecciones y análisis de liquidez
 */

// Calcular proyecciones de flujo de caja
export async function calculateCashFlowProjection(accountId, months = 12) {
  try {
    // 1. Obtener saldo actual de la cuenta
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single()

    if (accountError) throw accountError

    let currentBalance = account?.balance || 0

    // 2. Obtener transacciones históricas (últimos 3 meses para promedio)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: historicalTransactions, error: histError } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', threeMonthsAgo.toISOString())

    if (histError) throw histError

    // 3. Obtener transacciones programadas
    const { data: scheduledTransactions, error: schedError } = await supabase
      .from('scheduled_transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)

    if (schedError) throw schedError

    // 4. Generar proyecciones semanales
    const projections = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < months * 4; i++) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() + i * 7)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      // Calcular ingresos y egresos programados para esta semana
      let weekIncome = 0
      let weekExpenses = 0

      scheduledTransactions.forEach(transaction => {
        const transDate = new Date(transaction.next_due_date)

        // Verificar si la transacción ocurre en esta semana
        if (transDate >= weekStart && transDate <= weekEnd) {
          if (transaction.type === 'income') {
            weekIncome += transaction.amount
          } else {
            weekExpenses += transaction.amount
          }
        }
      })

      const weekBalance = weekIncome - weekExpenses
      currentBalance += weekBalance

      // Obtener umbral crítico
      const { data: threshold } = await supabase
        .from('liquidity_thresholds')
        .select('critical_balance')
        .eq('account_id', accountId)
        .single()

      const criticalBalance = threshold?.critical_balance || 0
      const isCritical = currentBalance <= criticalBalance

      projections.push({
        account_id: accountId,
        week_start_date: weekStart.toISOString().split('T')[0],
        projected_balance: currentBalance,
        is_critical: isCritical
      })
    }

    logSupabaseData(projections, 'Proyecciones calculadas')
    return { success: true, data: projections }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Guardar proyecciones en base de datos
export async function saveCashFlowProjections(projections) {
  try {
    // Limpiar proyecciones antiguas
    if (projections.length > 0) {
      const accountId = projections[0].account_id
      await supabase
        .from('cash_flow_projections')
        .delete()
        .eq('account_id', accountId)
    }

    // Insertar nuevas proyecciones
    const { data, error } = await supabase
      .from('cash_flow_projections')
      .insert(projections)
      .select()

    if (error) throw error

    logSupabaseData(data, 'Proyecciones guardadas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener proyecciones guardadas
export async function getCashFlowProjections(accountId) {
  try {
    const { data, error } = await supabase
      .from('cash_flow_projections')
      .select('*')
      .eq('account_id', accountId)
      .order('week_start_date', { ascending: true })

    if (error) throw error

    logSupabaseData(data, 'Proyecciones obtenidas')
    return { success: true, data }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener métricas de inteligencia financiera
export async function getFinancialMetrics(accountId, months = 12) {
  try {
    // 1. Obtener transacciones del período
    const periodStart = new Date()
    periodStart.setMonth(periodStart.getMonth() - months)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', periodStart.toISOString())

    // 2. Obtener transacciones programadas
    const { data: scheduled } = await supabase
      .from('scheduled_transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('is_active', true)

    // 3. Calcular métricas
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const fixedExpenses = scheduled
      .filter(s => s.type === 'expense')
      .reduce((sum, s) => sum + s.amount, 0)

    const fixedIncome = scheduled
      .filter(s => s.type === 'income')
      .reduce((sum, s) => sum + s.amount, 0)

    const netBalance = income - expenses
    const projectedMonthlyIncome = (income / Math.max(months, 1))
    const projectedMonthlyExpenses = (expenses / Math.max(months, 1))

    // Días de liquidez crítica (meses con saldo bajo)
    const criticalDays = Math.round((fixedExpenses / projectedMonthlyIncome) * 30) || 0

    const metrics = {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: netBalance,
      fixedIncome: fixedIncome,
      fixedExpenses: fixedExpenses,
      incomeTaxRatio: (income > 0) ? ((fixedExpenses / income) * 100).toFixed(2) : 0,
      projectedMonthlyIncome: projectedMonthlyIncome.toFixed(2),
      projectedMonthlyExpenses: projectedMonthlyExpenses.toFixed(2),
      accumulatedSavings: (income - expenses - fixedExpenses).toFixed(2),
      criticalDaysPerYear: criticalDays,
      period: months
    }

    logSupabaseData(metrics, 'Métricas calculadas')
    return { success: true, data: metrics }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

// Obtener/Actualizar umbral de liquidez crítica
export async function getLiquidityThreshold(accountId) {
  try {
    const { data, error } = await supabase
      .from('liquidity_thresholds')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return { success: true, data: data || { account_id: accountId, critical_balance: 0, alert_days_before: 14 } }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}

export async function updateLiquidityThreshold(accountId, criticalBalance, alertDaysBefore = 14) {
  try {
    const { data, error } = await supabase
      .from('liquidity_thresholds')
      .upsert({
        account_id: accountId,
        critical_balance: criticalBalance,
        alert_days_before: alertDaysBefore
      }, { onConflict: 'account_id' })
      .select()

    if (error) throw error

    logSupabaseData(data[0], 'Umbral de liquidez actualizado')
    return { success: true, data: data[0] }
  } catch (error) {
    logSupabaseError(error)
    return { success: false, error: error.message }
  }
}
