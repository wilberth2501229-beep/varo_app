import { useEffect, useState } from 'react'
import { useCashFlowStore, getPeriodEndISO } from '../store/cashFlowStore'
import { formatCurrency } from '../utils/utils'
import { toLocalISODate } from '../services/cashFlowService'

const PERIODS = [
  { value: 'month', label: 'Próximo mes' },
  { value: 'quarter', label: '3 meses' },
  { value: 'year', label: '12 meses' },
]

const COLORS = {
  line: '#B8956A',
  income: '#2A3F35',
  expense: '#8B4545',
  grid: '#E8DCC9',
  axis: '#8B8680',
  paper: '#FAFAF8',
}

const M = { top: 20, right: 16, bottom: 36, left: 60 }
const MIN_LABEL_GAP = 44
const LIST_PREVIEW = 8
const HIT_RADIUS = 32
const TOOLTIP_WIDTH = 236

const money = (n) => formatCurrency(n, 'MXN')
const signedMoney = (n) => `${n >= 0 ? '+' : '−'}${money(Math.abs(n))}`
const compactMoney = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const parseDate = (iso) => new Date(`${iso}T00:00:00`)
const shortDate = (iso) => parseDate(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })

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

function SummaryItem({ label, value, detail, danger }) {
  return (
    <div>
      <p className="text-xs text-charcoal-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-semibold tabular ${danger ? 'text-burgundy-700' : 'text-charcoal-700'}`}>{value}</p>
      {detail && <p className="text-xs text-charcoal-500">{detail}</p>}
    </div>
  )
}

function PointTooltip({ point, chartWidth, criticalBalance, todayISO }) {
  // Se centra sobre el punto sin salirse de la gráfica; si el punto está muy arriba, se muestra debajo
  const left = Math.min(Math.max(point.cx - TOOLTIP_WIDTH / 2, 0), chartWidth - TOOLTIP_WIDTH)
  const above = point.cy > 130
  const style = {
    left,
    top: above ? point.cy - 14 : point.cy + 14,
    width: TOOLTIP_WIDTH,
    transform: above ? 'translateY(-100%)' : 'none',
  }
  const date = parseDate(point.date)
  const weekday = date.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', '')
  const dateLabel =
    point.date === todayISO
      ? 'Hoy'
      : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${shortDate(point.date)}`
  const belowThreshold = point.balance < criticalBalance

  return (
    <div
      role="tooltip"
      style={style}
      className="absolute z-10 pointer-events-none rounded-lg border border-bronze-300 bg-cream-50 shadow-lg px-3 py-2.5 text-sm"
    >
      {point.kind === 'start' ? (
        <>
          <p className="text-xs text-charcoal-500">Inicio de hoy</p>
          <p className="font-medium text-charcoal-700 mt-0.5">Saldo {money(point.balance)}</p>
          <p className="text-xs text-charcoal-500 mt-1">Antes de los movimientos de hoy</p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-xs text-charcoal-500">
            <span className="whitespace-nowrap">{dateLabel}</span>
            <span className="uppercase tracking-wide">{point.source === 'registered' ? 'Registrado' : 'Programado'}</span>
          </div>
          <p className="font-medium text-charcoal-700 mt-1 truncate">{point.description}</p>
          <p className={`text-lg font-semibold tabular ${point.type === 'income' ? 'text-forest-700' : 'text-burgundy-700'}`}>
            {signedMoney(point.delta)}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-bronze-200 flex justify-between text-xs text-charcoal-600 tabular">
            <span>Saldo {money(point.before)}</span>
            <span aria-hidden="true">→</span>
            <span className={belowThreshold ? 'text-burgundy-700 font-medium' : 'font-medium'}>{money(point.balance)}</span>
          </div>
          {belowThreshold && (
            <p className="text-xs text-burgundy-700 mt-1">Queda bajo tu umbral de {money(criticalBalance)}</p>
          )}
        </>
      )}
    </div>
  )
}

function xTicks(startDate, endDate, period) {
  const ticks = []
  if (period === 'month') {
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)) {
      ticks.push({ date: d, text: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) })
    }
    return ticks
  }
  for (let d = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1); d <= endDate; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    ticks.push({ date: d, text: d.toLocaleDateString('es-MX', { month: 'short' }) })
  }
  return ticks
}

export default function CashFlowChart() {
  const [period, setPeriod] = useState('quarter')
  const [showAll, setShowAll] = useState(false)
  const [active, setActive] = useState(null)
  const [chartRef, containerWidth] = useContainerWidth()
  const {
    getEventsByPeriod,
    openingBalance,
    startingBalance,
    registeredBalance,
    scheduledToDate,
    criticalBalance,
    lastUpdated,
  } = useCashFlowStore()

  const events = getEventsByPeriod(period)
  const W = containerWidth || 800
  const H = W < 500 ? 240 : 320

  const selector = (
    <div className="inline-flex rounded-lg border border-bronze-300 bg-cream-50 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => {
            setPeriod(p.value)
            setShowAll(false)
            setActive(null)
          }}
          className={`px-3 sm:px-4 py-1.5 text-sm rounded-md transition ${
            period === p.value ? 'bg-gold-500 text-cream-50 font-medium' : 'text-charcoal-600 hover:bg-cream-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )

  if (!lastUpdated) {
    return (
      <div className="bg-cream-50 border border-bronze-200 rounded-lg p-6 space-y-4">
        {selector}
        <p className="text-charcoal-500 text-center py-16">Calculando proyección...</p>
      </div>
    )
  }

  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const todayISO = toLocalISODate(startDate)
  const endISO = getPeriodEndISO(period)
  const endDate = parseDate(endISO)

  const endBalance = events.length ? events[events.length - 1].balance : startingBalance
  const lowest = events.reduce(
    (low, e) => (e.balance < low.balance ? e : low),
    { balance: startingBalance, date: null }
  )
  const room = lowest.balance - criticalBalance

  // Escala Y: incluye el umbral para que su línea siempre sea visible
  const values = [openingBalance, startingBalance, criticalBalance, ...events.map((e) => e.balance)]
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.1
  const yMin = rawMin - pad
  const yMax = rawMax + pad

  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const span = endDate - startDate || 1
  const x = (date) => M.left + ((date - startDate) / span) * plotW
  const y = (v) => M.top + ((yMax - v) / (yMax - yMin)) * plotH

  // Línea escalonada: parte del saldo al inicio de hoy; se mantiene hasta el día de cada movimiento y ahí sube o baja
  const path = [
    `M ${x(startDate)} ${y(openingBalance)}`,
    ...events.map((e) => `H ${x(parseDate(e.date))} V ${y(e.balance)}`),
    `H ${x(endDate)}`,
  ].join(' ')

  const gridValues = Array.from({ length: 5 }, (_, k) => yMin + ((yMax - yMin) * k) / 4)
  const ticks = xTicks(startDate, endDate, period).reduce((kept, tick) => {
    const prev = kept[kept.length - 1]
    const minX = prev ? x(prev.date) : M.left - MIN_LABEL_GAP / 2
    return x(tick.date) - minX < MIN_LABEL_GAP ? kept : [...kept, tick]
  }, [])

  const visibleEvents = showAll ? events : events.slice(0, LIST_PREVIEW)

  // Puntos interactivos: el inicio de hoy y cada movimiento, con su posición en pantalla
  const points = [
    { kind: 'start', date: todayISO, balance: openingBalance, cx: x(startDate), cy: y(openingBalance) },
    ...events.map((e, i) => ({
      ...e,
      kind: 'event',
      before: i === 0 ? openingBalance : events[i - 1].balance,
      cx: x(parseDate(e.date)),
      cy: y(e.balance),
    })),
  ]
  const activePoint = active === null ? null : points[active] ?? null

  // Toma el punto más cercano al cursor (o al dedo) para no exigir atinarle a un círculo de 7px
  const pickPoint = (evt) => {
    const rect = evt.currentTarget.getBoundingClientRect()
    const px = evt.clientX - rect.left
    const py = evt.clientY - rect.top
    let nearest = null
    let nearestDist = HIT_RADIUS
    points.forEach((p, i) => {
      const dist = Math.hypot(p.cx - px, p.cy - py)
      if (dist <= nearestDist) {
        nearest = i
        nearestDist = dist
      }
    })
    setActive(nearest)
  }

  return (
    <div className="bg-cream-50 border border-bronze-200 rounded-lg p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl">Proyección de saldo</h2>
        {selector}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryItem
          label="Saldo hoy"
          value={money(startingBalance)}
          detail={scheduledToDate !== 0 ? `Registrado ${money(registeredBalance)} ${scheduledToDate >= 0 ? '+' : '−'} programados ${money(Math.abs(scheduledToDate))}` : null}
        />
        <SummaryItem
          label="Disponible para gastar hoy"
          value={room > 0 ? money(room) : money(0)}
          detail={
            room >= 0
              ? `Sin bajar de tu umbral de ${money(criticalBalance)} hasta el ${shortDate(endISO)}`
              : `Te faltan ${money(-room)} para mantener tu umbral`
          }
          danger={room < 0}
        />
        <SummaryItem
          label="Saldo más bajo"
          value={money(lowest.balance)}
          detail={lowest.date ? `El ${shortDate(lowest.date)}` : 'Hoy'}
          danger={lowest.balance < criticalBalance}
        />
        <SummaryItem
          label="Saldo al final"
          value={money(endBalance)}
          detail={`Al ${shortDate(endISO)}`}
          danger={endBalance < criticalBalance}
        />
      </div>

      <div ref={chartRef} className="relative">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block"
          style={{ cursor: activePoint ? 'pointer' : 'default', touchAction: 'pan-y' }}
          role="img"
          aria-label="Gráfica de saldo proyectado con cada movimiento"
          onPointerMove={pickPoint}
          onPointerDown={pickPoint}
          onPointerLeave={(evt) => evt.pointerType === 'mouse' && setActive(null)}
        >
          {/* Zona bajo el umbral */}
          {y(criticalBalance) < M.top + plotH && (
            <rect
              x={M.left}
              y={Math.max(M.top, y(criticalBalance))}
              width={plotW}
              height={M.top + plotH - Math.max(M.top, y(criticalBalance))}
              fill={COLORS.expense}
              opacity="0.06"
            />
          )}

          {gridValues.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} stroke={COLORS.grid} />
              <text x={M.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" fontSize="11" fill={COLORS.axis}>
                {compactMoney.format(v)}
              </text>
            </g>
          ))}

          <line x1={M.left} x2={W - M.right} y1={y(criticalBalance)} y2={y(criticalBalance)} stroke={COLORS.expense} strokeWidth="1.5" strokeDasharray="6 4" />
          <text x={M.left + 6} y={y(criticalBalance) - 6} fontSize="11" fill={COLORS.expense}>
            Umbral {compactMoney.format(criticalBalance)}
          </text>

          <path d={path} fill="none" stroke={COLORS.line} strokeWidth="2.5" strokeLinejoin="round" />

          <circle cx={x(startDate)} cy={y(openingBalance)} r="4" fill={COLORS.line} />

          {events.map((e, i) => (
            <circle
              key={`${e.date}-${i}`}
              cx={x(parseDate(e.date))}
              cy={y(e.balance)}
              r="3.5"
              fill={e.balance < criticalBalance ? COLORS.paper : e.type === 'income' ? COLORS.income : COLORS.expense}
              stroke={e.type === 'income' ? COLORS.income : COLORS.expense}
              strokeWidth={e.balance < criticalBalance ? 2 : 0}
            />
          ))}

          {activePoint && (
            <g pointerEvents="none">
              <line x1={activePoint.cx} x2={activePoint.cx} y1={M.top} y2={M.top + plotH} stroke={COLORS.axis} strokeDasharray="3 3" opacity="0.6" />
              <circle
                cx={activePoint.cx}
                cy={activePoint.cy}
                r="8"
                fill="none"
                strokeWidth="2"
                stroke={activePoint.kind === 'start' ? COLORS.line : activePoint.type === 'income' ? COLORS.income : COLORS.expense}
              />
            </g>
          )}

          {ticks.map((t) => (
            <text key={t.text + t.date.getTime()} x={x(t.date)} y={H - M.bottom + 20} textAnchor="middle" fontSize="11" fill={COLORS.axis}>
              {t.text}
            </text>
          ))}
        </svg>

        {activePoint && (
          <PointTooltip point={activePoint} chartWidth={W} criticalBalance={criticalBalance} todayISO={todayISO} />
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-charcoal-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-forest-700" /> Ingreso</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-burgundy-700" /> Gasto</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-burgundy-700" /> Saldo bajo el umbral</span>
      </div>

      {/* Lista de movimientos: en celular no hay cursor para ver el detalle de cada punto */}
      <div>
        <h3 className="text-lg mb-2">Movimientos desde hoy</h3>
        {events.length === 0 ? (
          <p className="text-sm text-charcoal-500">No hay movimientos en este periodo.</p>
        ) : (
          <>
            <ul className="divide-y divide-bronze-200 border-y border-bronze-200">
              {visibleEvents.map((e, i) => (
                <li key={`${e.date}-${i}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-charcoal-700 truncate">{e.description}</p>
                    <p className="text-xs text-charcoal-500">
                      {e.date === todayISO ? 'Hoy' : shortDate(e.date)} · {e.source === 'registered' ? 'Registrado' : 'Programado'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular">
                    <p className={e.type === 'income' ? 'text-forest-700' : 'text-burgundy-700'}>{signedMoney(e.delta)}</p>
                    <p className={`text-xs ${e.balance < criticalBalance ? 'text-burgundy-700 font-medium' : 'text-charcoal-500'}`}>
                      Saldo {money(e.balance)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {events.length > LIST_PREVIEW && (
              <button onClick={() => setShowAll(!showAll)} className="mt-2 text-sm text-gold-700 hover:text-gold-800 font-medium">
                {showAll ? 'Ver menos' : `Ver todos (${events.length})`}
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-charcoal-500">
        Incluye tus transacciones registradas (también las de fecha futura) y tus programados. Los programados cuya
        fecha ya pasó este mes se cuentan como realizados. No registres como transacción un movimiento que ya tienes
        programado, o se contará dos veces.
      </p>
    </div>
  )
}
