import { useEffect, useState } from 'react'
import { useCashFlowStore } from '../store/cashFlowStore'
import { formatCurrency } from '../utils/utils'

const PERIODS = [
  { value: 'month', label: 'Próximo mes' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: '12 meses' },
]

const M = { top: 20, right: 16, bottom: 36, left: 60 }
const MIN_LABEL_GAP = 40

// El SVG se dibuja al ancho real del contenedor para que el texto no se encoja en móvil
function useContainerWidth() {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])
  return [setNode, width]
}

const money = (n) => formatCurrency(n, 'MXN')
const compactMoney = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const parseDate = (iso) => new Date(`${iso}T00:00:00`)
const shortDate = (iso) => parseDate(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

function SummaryItem({ label, value, detail, danger }) {
  return (
    <div>
      <p className="text-xs text-charcoal-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-semibold tabular ${danger ? 'text-burgundy-700' : 'text-charcoal-700'}`}>{value}</p>
      {detail && <p className="text-xs text-charcoal-500">{detail}</p>}
    </div>
  )
}

export default function CashFlowChart() {
  const [period, setPeriod] = useState('quarter')
  const [chartRef, containerWidth] = useContainerWidth()
  const { getProjectionsByPeriod, criticalBalance } = useCashFlowStore()
  const weeks = getProjectionsByPeriod(period)
  const W = containerWidth || 800
  const H = W < 500 ? 240 : 320

  const selector = (
    <div className="inline-flex rounded-lg border border-bronze-300 bg-cream-50 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => setPeriod(p.value)}
          className={`px-3 sm:px-4 py-1.5 text-sm rounded-md transition ${
            period === p.value ? 'bg-gold-500 text-cream-50 font-medium' : 'text-charcoal-600 hover:bg-cream-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )

  if (weeks.length === 0) {
    return (
      <div className="bg-cream-50 border border-bronze-200 rounded-lg p-6 space-y-4">
        {selector}
        <p className="text-charcoal-500 text-center py-16">No hay proyecciones disponibles</p>
      </div>
    )
  }

  const lowOf = (w) => w.min_balance ?? w.projected_balance
  const first = weeks[0]
  const startBalance = first.projected_balance - (first.income ?? 0) + (first.expenses ?? 0)
  const endBalance = weeks[weeks.length - 1].projected_balance
  const lowestWeek = weeks.reduce((low, w) => (lowOf(w) < lowOf(low) ? w : low), weeks[0])
  const criticalCount = weeks.filter((w) => w.is_critical).length

  // Escala Y: incluye el umbral para que su línea siempre sea visible
  const values = [startBalance, criticalBalance, ...weeks.flatMap((w) => [w.projected_balance, lowOf(w)])]
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.1
  const yMin = rawMin - pad
  const yMax = rawMax + pad

  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const x = (i) => M.left + (weeks.length === 1 ? plotW / 2 : (i / (weeks.length - 1)) * plotW)
  const y = (v) => M.top + ((yMax - v) / (yMax - yMin)) * plotH

  const linePoints = weeks.map((w, i) => `${x(i)},${y(w.projected_balance)}`).join(' ')
  const gridValues = Array.from({ length: 5 }, (_, k) => yMin + ((yMax - yMin) * k) / 4)

  // Etiquetas del eje X: cada semana en "próximo mes", el inicio de cada mes en los demás
  // y se descartan las que quedarían encimadas
  const xLabels = weeks
    .map((w, i) => ({ i, date: parseDate(w.week_start_date) }))
    .filter(({ date }, idx, arr) => period === 'month' || idx === 0 || date.getMonth() !== arr[idx - 1].date.getMonth())
    .reduce((kept, label) => {
      const prev = kept[kept.length - 1]
      return prev && x(label.i) - x(prev.i) < MIN_LABEL_GAP ? kept : [...kept, label]
    }, [])
    .map(({ i, date }) => ({
      i,
      text: period === 'month'
        ? shortDate(weeks[i].week_start_date)
        : date.toLocaleDateString('es-MX', { month: 'short' }),
    }))

  return (
    <div className="bg-cream-50 border border-bronze-200 rounded-lg p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl">Proyección de saldo</h2>
        {selector}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryItem label="Saldo hoy" value={money(startBalance)} />
        <SummaryItem
          label="Saldo al final"
          value={money(endBalance)}
          detail={`Semana del ${shortDate(weeks[weeks.length - 1].week_start_date)}`}
          danger={endBalance < criticalBalance}
        />
        <SummaryItem
          label="Saldo más bajo"
          value={money(lowOf(lowestWeek))}
          detail={`Semana del ${shortDate(lowestWeek.week_start_date)}`}
          danger={lowOf(lowestWeek) < criticalBalance}
        />
        <SummaryItem
          label="Semanas en riesgo"
          value={`${criticalCount} de ${weeks.length}`}
          detail={`Umbral: ${money(criticalBalance)}`}
          danger={criticalCount > 0}
        />
      </div>

      <div ref={chartRef}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label="Gráfica de saldo proyectado por semana">
        {gridValues.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} stroke="#E8DCC9" />
            <text x={M.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#8B8680">
              {compactMoney.format(v)}
            </text>
          </g>
        ))}

        {yMin < 0 && yMax > 0 && (
          <line x1={M.left} x2={W - M.right} y1={y(0)} y2={y(0)} stroke="#A89968" strokeWidth="1" />
        )}

        <line
          x1={M.left}
          x2={W - M.right}
          y1={y(criticalBalance)}
          y2={y(criticalBalance)}
          stroke="#8B4545"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        <text x={M.left + 6} y={y(criticalBalance) - 6} fontSize="11" fill="#8B4545">
          Umbral crítico
        </text>

        <polyline points={linePoints} fill="none" stroke="#B8956A" strokeWidth="2.5" strokeLinejoin="round" />

        {/* En semanas críticas, marca hasta dónde bajó el saldo antes del cierre */}
        {weeks.map((w, i) =>
          w.is_critical && lowOf(w) < w.projected_balance ? (
            <g key={`low-${w.week_start_date}`}>
              <line x1={x(i)} x2={x(i)} y1={y(w.projected_balance)} y2={y(lowOf(w))} stroke="#8B4545" strokeWidth="1.5" strokeDasharray="2 3" />
              <circle cx={x(i)} cy={y(lowOf(w))} r="3.5" fill="#FAFAF8" stroke="#8B4545" strokeWidth="1.5" />
            </g>
          ) : null
        )}

        {weeks.map((w, i) => (
          <circle key={w.week_start_date} cx={x(i)} cy={y(w.projected_balance)} r={w.is_critical ? 4.5 : 3} fill={w.is_critical ? '#8B4545' : '#B8956A'}>
            <title>
              {`Semana del ${shortDate(w.week_start_date)}\n` +
                `Saldo al cierre: ${money(w.projected_balance)}\n` +
                `Saldo más bajo: ${money(lowOf(w))}\n` +
                `Ingresos: ${money(w.income ?? 0)} · Gastos: ${money(w.expenses ?? 0)}`}
            </title>
          </circle>
        ))}

        {xLabels.map(({ i, text }) => (
          <text key={i} x={x(i)} y={H - M.bottom + 20} textAnchor="middle" fontSize="11" fill="#8B8680">
            {text}
          </text>
        ))}
      </svg>
      </div>

      <p className="text-xs text-charcoal-500">
        Saldo al cierre de cada semana, según tus transacciones programadas activas. Los puntos en rojo marcan
        semanas en las que el saldo baja del umbral crítico en algún momento; la línea punteada llega al saldo
        más bajo de esa semana.
      </p>
    </div>
  )
}
