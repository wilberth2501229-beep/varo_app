import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * FLUJO DE CAJA - Proyecciones y análisis de liquidez
 */

const MONTHLY_FACTOR = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
}

export function toMonthlyAmount(amount, frequency) {
  return Number(amount) * (MONTHLY_FACTOR[frequency] ?? 1)
}

// Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y puede cambiar el día)
function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Suma meses sin desplazar el día: un pago del 31 cae el 28/29 en febrero y vuelve al 31 en marzo
function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay))
}

const OCCURRENCE = {
  weekly: (anchor, n) => addDays(anchor, 7 * n),
  biweekly: (anchor, n) => addDays(anchor, 14 * n),
  monthly: (anchor, n) => addMonths(anchor, n),
  quarterly: (anchor, n) => addMonths(anchor, 3 * n),
  annual: (anchor, n) => addMonths(anchor, 12 * n),
}

// Todas las fechas en que ocurre un programado entre `from` y `to`.
// next_due_date no se actualiza tras cada pago, así que las fechas vencidas se avanzan hasta hoy.
function expandOccurrences(scheduled, from, to) {
  const nth = OCCURRENCE[scheduled.frequency] ?? OCCURRENCE.monthly
  const anchor = parseLocalDate(scheduled.next_due_date)
  const end = scheduled.end_date ? parseLocalDate(scheduled.end_date) : null
  const limit = end && end < to ? end : to

  const dates = []
  let n = 0
  let date = anchor
  while (date < from) date = nth(anchor, ++n)
  while (date <= limit) {
    dates.push(date)
    date = nth(anchor, ++n)
  }
  return dates
}

const round2 = (n) => Math.round(n * 100) / 100

// Proyección semanal pura (sin acceso a datos) para poder probarla de forma aislada
export function buildWeeklyProjection({ startingBalance, scheduled, criticalBalance, today, months }) {
  const horizonEnd = addMonths(today, months)

  const events = scheduled
    .flatMap((s) =>
      expandOccurrences(s, today, horizonEnd).map((date) => ({
        date,
        delta: s.type === 'income' ? Number(s.amount) : -Number(s.amount),
      }))
    )
    .sort((a, b) => a.date - b.date)

  const weeks = []
  let balance = startingBalance
  let i = 0

  for (let weekStart = today; weekStart <= horizonEnd; weekStart = addDays(weekStart, 7)) {
    const weekEnd = addDays(weekStart, 6)
    let income = 0
    let expenses = 0
    let minBalance = balance

    while (i < events.length && events[i].date <= weekEnd) {
      const { delta } = events[i++]
      balance += delta
      if (delta >= 0) income += delta
      else expenses -= delta
      minBalance = Math.min(minBalance, balance)
    }

    weeks.push({
      week_start_date: toLocalISODate(weekStart),
      projected_balance: round2(balance),
      min_balance: round2(minBalance),
      income: round2(income),
      expenses: round2(expenses),
      is_critical: minBalance < criticalBalance,
    })
  }

  return weeks
}

// Calcular proyecciones de flujo de caja
export async function calculateCashFlowProjection(accountId, months = 12) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Saldo inicial = ingresos − gastos registrados hasta hoy (mismo criterio que el Dashboard)
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('account_id', accountId)
      .lte('transaction_date', toLocalISODate(today))

    if (txError) throw txError

    const { data: scheduled, error: schedError } = await supabase
      .from('scheduled_transactions')
      .select('type, amount, frequency, next_due_date, end_date')
      .eq('account_id', accountId)
      .eq('is_active', true)

    if (schedError) throw schedError

    const { data: threshold, error: thresholdError } = await supabase
      .from('liquidity_thresholds')
      .select('critical_balance')
      .eq('account_id', accountId)
      .maybeSingle()

    if (thresholdError) throw thresholdError

    const startingBalance = transactions.reduce(
      (sum, t) => sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)),
      0
    )
    const criticalBalance = Number(threshold?.critical_balance ?? 0)

    const projections = buildWeeklyProjection({
      startingBalance,
      scheduled,
      criticalBalance,
      today,
      months,
    }).map((week) => ({ account_id: accountId, ...week }))

    logSupabaseData(projections, 'Proyecciones calculadas')
    return { success: true, data: projections, startingBalance, criticalBalance }
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

    // Solo las columnas que existen en la tabla
    const rows = projections.map(({ account_id, week_start_date, projected_balance, is_critical }) => ({
      account_id,
      week_start_date,
      projected_balance,
      is_critical,
    }))

    const { data, error } = await supabase
      .from('cash_flow_projections')
      .insert(rows)
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

// period: 'month' (mes calendario actual) o un número de meses hacia atrás
function getPeriodStart(period) {
  const today = new Date()
  if (period === 'month') return new Date(today.getFullYear(), today.getMonth(), 1)
  return new Date(today.getFullYear(), today.getMonth() - period, today.getDate())
}

// Meses que realmente cubren los datos, para no promediar sobre meses sin actividad
function getMonthsWithData(transactions, period) {
  if (period === 'month' || transactions.length === 0) return 1
  const earliest = transactions.reduce(
    (min, t) => (t.transaction_date < min ? t.transaction_date : min),
    transactions[0].transaction_date
  )
  const days = (Date.now() - new Date(`${earliest}T00:00:00`).getTime()) / 86400000
  return Math.min(period, Math.max(1, Math.ceil(days / 30.44)))
}

const sumBy = (items, type, amountOf) =>
  items.filter((i) => i.type === type).reduce((sum, i) => sum + amountOf(i), 0)

// Obtener métricas de inteligencia financiera
export async function getFinancialMetrics(accountId, period = 'month') {
  try {
    const periodStart = getPeriodStart(period)

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, transaction_date')
      .eq('account_id', accountId)
      .gte('transaction_date', toLocalISODate(periodStart))
      .lte('transaction_date', toLocalISODate(new Date()))

    if (txError) throw txError

    const { data: scheduled, error: schedError } = await supabase
      .from('scheduled_transactions')
      .select('type, amount, frequency')
      .eq('account_id', accountId)
      .eq('is_active', true)

    if (schedError) throw schedError

    const income = sumBy(transactions, 'income', (t) => Number(t.amount))
    const expenses = sumBy(transactions, 'expense', (t) => Number(t.amount))
    const monthsWithData = getMonthsWithData(transactions, period)
    const avgMonthlyIncome = income / monthsWithData
    const avgMonthlyExpenses = expenses / monthsWithData
    const netFlow = income - expenses

    const fixedMonthlyIncome = sumBy(scheduled, 'income', (s) => toMonthlyAmount(s.amount, s.frequency))
    const fixedMonthlyExpenses = sumBy(scheduled, 'expense', (s) => toMonthlyAmount(s.amount, s.frequency))

    // Base de ingreso para el ratio: lo esperado por programados; si no hay, el promedio real
    const incomeBase = fixedMonthlyIncome > 0 ? fixedMonthlyIncome : avgMonthlyIncome

    const metrics = {
      period,
      periodStart: toLocalISODate(periodStart),
      monthsWithData,
      totalIncome: income,
      totalExpenses: expenses,
      netFlow,
      savingsRate: income > 0 ? (netFlow / income) * 100 : null,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      projectedMonthlyIncome: fixedMonthlyIncome,
      fixedMonthlyExpenses,
      projectedMonthlyMargin: fixedMonthlyIncome - fixedMonthlyExpenses,
      fixedExpenseRatio: incomeBase > 0 ? (fixedMonthlyExpenses / incomeBase) * 100 : null,
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
