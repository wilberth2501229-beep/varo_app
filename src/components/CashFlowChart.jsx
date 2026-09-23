import { useCashFlowStore } from '../store/cashFlowStore'

export default function CashFlowChart({ period = 'month' }) {
  const { getProjectionsByPeriod, getMinimumBalance, getMaximumBalance } = useCashFlowStore()
  const projections = getProjectionsByPeriod(period)

  if (projections.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-80">
        <p className="text-gray-500">No hay proyecciones disponibles</p>
      </div>
    )
  }

  const minBalance = getMinimumBalance()
  const maxBalance = getMaximumBalance()
  const range = maxBalance - minBalance || 1
  const padding = range * 0.1

  // Normalizar valores para escala de SVG
  const svgHeight = 300
  const svgWidth = Math.max(800, projections.length * 20)
  const chartHeight = svgHeight - 60
  const chartWidth = svgWidth - 80

  const getY = (balance) => {
    const normalized = (balance - minBalance + padding) / (range + padding * 2)
    return svgHeight - 40 - normalized * chartHeight
  }

  const getX = (index) => {
    return 40 + (index / Math.max(1, projections.length - 1)) * chartWidth
  }

  // Crear puntos para línea
  const points = projections
    .map((p, i) => `${getX(i)},${getY(p.projected_balance)}`)
    .join(' ')

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Proyección de Flujo de Caja</h2>

      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="border border-gray-200 rounded">
          {/* Grid horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = svgHeight - 40 - ratio * chartHeight
            const balance = minBalance + ratio * range

            return (
              <g key={`grid-${ratio}`}>
                <line
                  x1="40"
                  y1={y}
                  x2={svgWidth - 20}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeDasharray="5,5"
                />
                <text
                  x="5"
                  y={y}
                  fontSize="12"
                  fill="#666"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  ${Math.round(balance)}
                </text>
              </g>
            )
          })}

          {/* Línea de proyección */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos de datos */}
          {projections.map((p, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(p.projected_balance)}
              r="3"
              fill={p.is_critical ? '#ef4444' : '#3b82f6'}
              className="hover:r-5 transition-all cursor-pointer"
            />
          ))}

          {/* Eje X */}
          <line x1="40" y1={svgHeight - 40} x2={svgWidth - 20} y2={svgHeight - 40} stroke="#000" strokeWidth="1" />
          {/* Eje Y */}
          <line x1="40" y1="20" x2="40" y2={svgHeight - 40} stroke="#000" strokeWidth="1" />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-600">Saldo Máximo</p>
          <p className="text-lg font-bold text-blue-600">${maxBalance.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-3 rounded">
          <p className="text-xs text-gray-600">Saldo Mínimo</p>
          <p className="text-lg font-bold text-red-600">${minBalance.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-xs text-gray-600">Rango</p>
          <p className="text-lg font-bold text-green-600">${range.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
