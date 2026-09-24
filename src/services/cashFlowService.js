import { supabase, logSupabaseError, logSupabaseData } from './supabase'

/**
 * FLUJO DE CAJA - Proyecciones y análisis de liquidez
 *
 * Modelo: los gastos variables se registran como transacciones; los compromisos fijos
 * (quincenas, renta, servicios) viven como programados y NO se registran. Por eso las
 * fechas de un programado que ya pasaron cuentan como movimientos realizados.
 */

const MONTHLY_FACTOR = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
}

export function toMonthlyAmount(amount, frequency) {
  return Number(amount) * (MONTHLY_FACTOR[frequency] ?? 1)
}

// Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y puede cambiar el día)
export function toLocalISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseLocalDate(isoDate) {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfToday() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

const lastDayOfMonth = (year, month) => new Date(year, month + 1, 0).getDate()

// Suma meses sin desplazar el día: un pago del 31 cae el 28/29 en febrero y vuelve al 31 en marzo
function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const day = Math.min(date.getDate(), lastDayOfMonth(target.getFullYear(), target.getMonth()))
  return new Date(target.getFullYear(), target.getMonth(), day)
}

// Quincena: día 15 y último día de cada mes, empezando por la primera que no sea anterior al ancla
function semimonthly(anchor, n) {
  const slot = (anchor.getDate() <= 15 ? 0 : 1) + n
  const month = new Date(anchor.getFullYear(), anchor.getMonth() + Math.floor(slot / 2), 1)
  const day = slot % 2 === 0 ? 15 : lastDayOfMonth(month.getFullYear(), month.getMonth())
  return new Date(month.getFullYear(), month.getMonth(), day)
}

const OCCURRENCE = {
  weekly: (anchor, n) => addDays(anchor, 7 * n),
  biweekly: (anchor, n) => addDays(anchor, 14 * n),
  semimonthly,
  monthly: (anchor, n) => addMonths(anchor, n),
  quarterly: (anchor, n) => addMonths(anchor, 3 * n),
  annual: (anchor, n) => addMonths(anchor, 12 * n),
}

// next_due_date es el ancla de la serie (la primera fecha que capturó el usuario); no se actualiza tras cada pago
function expandOccurrences(scheduled, from, to) {
  const nth = OCCURRENCE[scheduled.frequency] ?? OCCURRENCE.monthly
  const anchor = parseLocalDate(scheduled.next_due_date)
  const end = scheduled.end_date ? parseLocalDate(scheduled.end_date) : null
  const limit = end && end < to ? end : to

  const dates = []
  let n = 0
  let date = nth(anchor, 0)
  while (date < from) date = nth(anchor, ++n)
  while (date <= limit) {
    dates.push(date)
    date = nth(anchor, ++n)
  }
  return dates
}

// Las fechas pasadas cuentan desde el mes en que se creó el programado, para no sumar
// meses anteriores a que existiera en la app
function countedSince(scheduled) {
  const anchor = parseLocalDate(scheduled.next_due_date)
  if (!scheduled.start_date) return anchor
  const created = parseLocalDate(scheduled.start_date)
  const monthStart = new Date(created.getFullYear(), created.getMonth(), 1)
  return anchor > monthStart ? anchor : monthStart
}

const signedAmount = (item) => (item.type === 'income' ? Number(item.amount) : -Number(item.amount))

function describe(scheduled) {
  return scheduled.description || scheduled.category || (scheduled.type === 'income' ? 'Ingreso programado' : 'Gasto programado')
}

// Movimientos de programados entre `from` (opcional) y `to`, ordenados por fecha
function scheduledEvents(scheduled, from, to) {
  return scheduled
    .flatMap((s) => {
      const since = countedSince(s)
      const start = from && from > since ? from : since
      return expandOccurrences(s, start, to).map((date) => ({
        date,
        delta: signedAmount(s),
        type: s.type,
        description: describe(s),
      }))
    })
    .sort((a, b) => a.date - b.date)
}

export function getNextOccurrence(scheduled, from = startOfToday()) {
  return expandOccurrences(scheduled, from, addMonths(from, 13))[0] ?? null
}

const round2 = (n) => Math.round(n * 100) / 100

function registeredEvent(t) {
  return {
    date: parseLocalDate(t.transaction_date),
    delta: signedAmount(t),
    type: t.type,
    description: t.description || t.category || (t.type === 'income' ? 'Ingreso' : 'Gasto'),
    source: 'registered',
  }
}

// Mismo día: primero ingresos, para no marcar una baja que no ocurre si la quincena llega ese día
const byDateIncomeFirst = (a, b) => a.date - b.date || (a.type === 'income' ? -1 : 0) - (b.type === 'income' ? -1 : 0)

// Línea de tiempo pura (sin acceso a datos) para poder probarla de forma aislada.
// `transactions` son las registradas manualmente (pasadas y futuras).
export function buildCashFlowTimeline({ transactions, scheduled, criticalBalance, today, months }) {
  const horizonEnd = addMonths(today, months)
  const todayISO = toLocalISODate(today)
  const yesterday = addDays(today, -1)

  const registeredBefore = transactions
    .filter((t) => t.transaction_date < todayISO)
    .reduce((sum, t) => sum + signedAmount(t), 0)
  const scheduledBefore = scheduledEvents(scheduled, null, yesterday).reduce((sum, e) => sum + e.delta, 0)
  const openingBalance = registeredBefore + scheduledBefore

  // Desde hoy: movimientos registrados y programados, cada uno en su fecha
  let running = openingBalance
  const events = [
    ...transactions
      .filter((t) => t.transaction_date >= todayISO && parseLocalDate(t.transaction_date) <= horizonEnd)
      .map(registeredEvent),
    ...scheduledEvents(scheduled, today, horizonEnd).map((e) => ({ ...e, source: 'scheduled' })),
  ]
    .sort(byDateIncomeFirst)
    .map((e) => {
      running += e.delta
      return { ...e, date: toLocalISODate(e.date), balance: round2(running) }
    })

  const todaysEvents = events.filter((e) => e.date === todayISO)
  const startingBalance = openingBalance + todaysEvents.reduce((sum, e) => sum + e.delta, 0)
  const registeredBalance = registeredBefore + todaysEvents.filter((e) => e.source === 'registered').reduce((sum, e) => sum + e.delta, 0)
  const scheduledToDate = startingBalance - registeredBalance

  // Resumen semanal (lo usan las alertas y la tabla cash_flow_projections)
  const weeks = []
  let balance = openingBalance
  let i = 0
  for (let weekStart = today; weekStart <= horizonEnd; weekStart = addDays(weekStart, 7)) {
    const weekEndISO = toLocalISODate(addDays(weekStart, 6))
    let income = 0
    let expenses = 0
    let minBalance = balance

    while (i < events.length && events[i].date <= weekEndISO) {
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

  return {
    openingBalance: round2(openingBalance),
    registeredBalance: round2(registeredBalance),
    scheduledToDate: round2(scheduledToDate),
    startingBalance: round2(startingBalance),
    events,
    weeks,
  }
}

const SCHEDULED_FIELDS = 'type, amount, frequency, next_due_date, end_date, start_date, description, category'

async function fetchActiveScheduled(accountId) {
  const { data, error } = await supabase
    .from('scheduled_transactions')
    .select(SCHEDULED_FIELDS)
    .eq('account_id', accountId)
    .eq('is_active', true)
  if (error) throw error
  return data
}

// Calcular proyecciones de flujo de caja
export async function calculateCashFlowProjection(accountId, months = 12) {
  try {
    const today = startOfToday()

    // Todas las registradas hasta el horizonte: las pasadas forman el saldo, las futuras son movimientos
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, transaction_date, description, category')
      .eq('account_id', accountId)
      .lte('transaction_date', toLocalISODate(addMonths(today, months)))

    if (txError) throw txError

    const scheduled = await fetchActiveScheduled(accountId)

    const { data: threshold, error: thresholdError } = await supabase
      .from('liquidity_thresholds')
      .select('critical_balance')
      .eq('account_id', accountId)
      .maybeSingle()

    if (thresholdError) throw thresholdError

    const criticalBalance = Number(threshold?.critical_balance ?? 0)

    const timeline = buildCashFlowTimeline({ transactions, scheduled, criticalBalance, today, months })

    logSupabaseData(timeline, 'Proyecciones calculadas')
    return {
      success: true,
      data: timeline.weeks.map((week) => ({ account_id: accountId, ...week })),
      events: timeline.events,
      openingBalance: timeline.openingBalance,
      startingBalance: timeline.startingBalance,
      registeredBalance: timeline.registeredBalance,
      scheduledToDate: timeline.scheduledToDate,
      criticalBalance,
    }
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
function getPeriodStart(period, today) {
  if (period === 'month') return new Date(today.getFullYear(), today.getMonth(), 1)
  return new Date(today.getFullYear(), today.getMonth() - period, today.getDate())
}

// Meses que realmente cubren los datos, para no promediar sobre meses sin actividad
function getMonthsWithData(isoDates, period, today) {
  if (period === 'month' || isoDates.length === 0) return 1
  const earliest = isoDates.reduce((min, d) => (d < min ? d : min))
  const days = (today - parseLocalDate(earliest)) / 86400000
  return Math.min(period, Math.max(1, Math.ceil((days + 1) / 30.44)))
}

const sumBy = (items, type, amountOf) =>
  items.filter((i) => i.type === type).reduce((sum, i) => sum + amountOf(i), 0)

// Obtener métricas de inteligencia financiera
export async function getFinancialMetrics(accountId, period = 'month') {
  try {
    const today = startOfToday()
    const periodStart = getPeriodStart(period, today)

    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('type, amount, transaction_date')
      .eq('account_id', accountId)
      .gte('transaction_date', toLocalISODate(periodStart))
      .lte('transaction_date', toLocalISODate(today))

    if (txError) throw txError

    const scheduled = await fetchActiveScheduled(accountId)
    const realized = scheduledEvents(scheduled, periodStart, today)

    const registeredIncome = sumBy(transactions, 'income', (t) => Number(t.amount))
    const registeredExpenses = sumBy(transactions, 'expense', (t) => Number(t.amount))
    const scheduledIncome = sumBy(realized, 'income', (e) => e.delta)
    const scheduledExpenses = sumBy(realized, 'expense', (e) => -e.delta)

    const income = registeredIncome + scheduledIncome
    const expenses = registeredExpenses + scheduledExpenses
    const monthsWithData = getMonthsWithData(
      [...transactions.map((t) => t.transaction_date), ...realized.map((e) => toLocalISODate(e.date))],
      period,
      today
    )
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
      scheduledIncome,
      scheduledExpenses,
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
