import { supabase } from './supabase'
import {
  getNextOccurrence,
  installmentProgress,
  scheduledByMonth,
  toLocalISODate,
  toMonthlyAmount,
} from './cashFlowService'

const round = (n) => Math.round((Number(n) || 0) * 100) / 100
const pct = (n) => (n == null ? null : Math.round(n))

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate())
}

function summarizeMetrics(m) {
  if (!m) return null
  return {
    ingresos: round(m.totalIncome),
    gastos: round(m.totalExpenses),
    flujo_neto: round(m.netFlow),
    tasa_de_ahorro_pct: pct(m.savingsRate),
    ingreso_mensual_programado: round(m.projectedMonthlyIncome),
    gasto_fijo_mensual: round(m.fixedMonthlyExpenses),
    margen_mensual_programado: round(m.projectedMonthlyMargin),
    gasto_fijo_sobre_ingreso_pct: pct(m.fixedExpenseRatio),
  }
}

// Resumen compacto de la situación: montos, fechas y descripciones de movimientos. No incluye correo ni nombre de cuenta
export function buildAnalysisContext({ today, cash, scheduled, posted, metrics }) {
  const todayISO = toLocalISODate(today)
  const events = cash.events ?? []
  const critical = cash.criticalBalance

  const lowest = events.reduce(
    (low, e) => (e.balance < low.balance ? { balance: e.balance, date: e.date } : low),
    { balance: cash.startingBalance, date: todayISO }
  )
  const balanceAt = (months) => {
    const limit = toLocalISODate(addMonths(today, months))
    const last = events.filter((e) => e.date <= limit).at(-1)
    return round(last ? last.balance : cash.startingBalance)
  }
  const firstBelow = events.find((e) => e.balance < critical)

  const commitments = scheduled
    .filter((s) => s.is_active === true && getNextOccurrence(s, today) !== null)
    .map((s) => {
      const progress = installmentProgress(s, today)
      return {
        descripcion: s.description,
        tipo: s.type === 'income' ? 'ingreso' : 'gasto',
        monto: round(s.amount),
        frecuencia: s.frequency,
        categoria: s.category ?? null,
        equivalente_mensual: round(toMonthlyAmount(s.amount, s.frequency)),
        ...(progress && {
          ultimo_pago: progress.lastDate,
          pagos_restantes: progress.remaining,
          monto_restante: progress.remainingAmount,
        }),
      }
    })

  const since = toLocalISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90))
  const byCategory = posted
    .filter((t) => t.type === 'expense' && t.transaction_date >= since)
    .reduce((acc, t) => {
      const key = t.category || 'Sin categoría'
      return { ...acc, [key]: (acc[key] ?? 0) + Number(t.amount) }
    }, {})

  const recentSince = toLocalISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30))
  const recent = posted
    .filter((t) => t.transaction_date >= recentSince)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 40)
    .map((t) => ({
      fecha: t.transaction_date,
      tipo: t.type === 'income' ? 'ingreso' : 'gasto',
      monto: round(t.amount),
      categoria: t.category ?? null,
      descripcion: (t.description ?? '').slice(0, 60),
      programada: t.source === 'scheduled',
    }))

  return {
    fecha_hoy: todayISO,
    moneda: 'MXN',
    saldo_hoy: round(cash.startingBalance),
    saldo_registrado: round(cash.registeredBalance),
    saldo_por_programados_ejecutados: round(cash.scheduledToDate),
    umbral_critico: round(critical),
    proyeccion_12_meses: {
      saldo_mas_bajo: { monto: round(lowest.balance), fecha: lowest.date },
      saldo_en_3_meses: balanceAt(3),
      saldo_en_12_meses: balanceAt(12),
      primer_movimiento_bajo_umbral: firstBelow ? { fecha: firstBelow.date, saldo: round(firstBelow.balance) } : null,
      proximos_movimientos: events.slice(0, 40).map((e) => ({
        fecha: e.date,
        descripcion: e.description,
        monto: round(e.delta),
        saldo_despues: round(e.balance),
        origen: e.source === 'registered' ? 'registrado' : 'programado',
      })),
    },
    programados_vigentes: commitments,
    programados_por_mes: scheduledByMonth(scheduled, today, 12).map((m) => ({
      mes: m.month.slice(0, 7),
      ingresos: m.income,
      gastos: m.expenses,
      neto: m.net,
      ...(m.endings.length > 0 && { termina: m.endings }),
    })),
    metricas: { mes_actual: summarizeMetrics(metrics.month), ultimos_3_meses: summarizeMetrics(metrics.quarter) },
    gasto_por_categoria_90_dias: Object.entries(byCategory)
      .map(([categoria, total]) => ({ categoria, total: round(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
    movimientos_recientes_30_dias: recent,
  }
}

// Texto listo para pegar en una conversación con Claude (sin usar la API)
export function formatSummaryForChat(context, question) {
  const ask = question?.trim() || 'Haz un análisis general de mi flujo de caja: qué tan sano está, riesgos y qué haría.'
  return [
    'Analiza mi flujo de caja de Varo (pesos mexicanos). Basa tu respuesta solo en estos datos, cita montos y fechas concretas, y dime riesgos y qué haría.',
    `Mi pregunta: ${ask}`,
    `<datos>\n${JSON.stringify(context)}\n</datos>`,
  ].join('\n\n')
}

export async function requestAnalysis({ context, question }) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) return { success: false, error: 'Inicia sesión para usar el análisis' }

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ context, question: question?.trim() || undefined }),
    })

    // En desarrollo local (vite) las funciones de /api no existen; solo corren en Vercel
    if (response.status === 404) {
      return { success: false, error: 'El análisis solo está disponible en la versión publicada (Vercel).' }
    }

    const body = await response.json().catch(() => ({}))
    if (!response.ok) return { success: false, error: body.error ?? 'No se pudo completar el análisis' }
    return { success: true, analysis: body.analysis }
  } catch {
    return { success: false, error: 'No se pudo conectar. Revisa tu conexión e intenta de nuevo' }
  }
}
