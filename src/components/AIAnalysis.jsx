import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCashFlowStore } from '../store/cashFlowStore'
import { useScheduledTransactionStore } from '../store/scheduledTransactionStore'
import { usePostedTransactions } from '../hooks/usePostedTransactions'
import { getFinancialMetrics } from '../services/cashFlowService'
import { buildAnalysisContext, requestAnalysis } from '../services/analysisService'

const SUGGESTIONS = [
  { label: 'Análisis general', question: '' },
  { label: '¿Qué tan sano es mi flujo?', question: '¿Qué tan sano es mi flujo de caja y cuál es el mayor riesgo en los próximos meses?' },
  { label: '¿Dónde puedo ahorrar?', question: '¿En qué categorías gasto de más y dónde podría ahorrar?' },
  { label: 'Mis compromisos con fin', question: 'Analiza mis compromisos con fecha de fin (préstamos): ¿cuándo se libera margen y qué conviene hacer con él?' },
]

const inline = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  )

// Markdown sencillo (títulos, viñetas, negritas) sin HTML crudo
function Analysis({ text }) {
  const blocks = []
  text.split('\n').forEach((raw) => {
    const line = raw.trim()
    const last = blocks[blocks.length - 1]
    if (!line) return
    const bullet = line.match(/^(?:[-*]|\d+\.)\s+(.*)$/)
    if (/^#{1,4}\s/.test(line)) blocks.push({ type: 'heading', text: line.replace(/^#{1,4}\s+/, '') })
    else if (bullet && last?.type === 'list') last.items.push(bullet[1])
    else if (bullet) blocks.push({ type: 'list', items: [bullet[1]] })
    else blocks.push({ type: 'paragraph', text: line })
  })

  return (
    <div className="space-y-3 text-sm text-charcoal-700 leading-relaxed">
      {blocks.map((block, i) =>
        block.type === 'heading' ? (
          <h4 key={i} className="text-base font-semibold text-charcoal-700 pt-2">{inline(block.text)}</h4>
        ) : block.type === 'list' ? (
          <ul key={i} className="list-disc pl-5 space-y-1">
            {block.items.map((item, j) => <li key={j}>{inline(item)}</li>)}
          </ul>
        ) : (
          <p key={i}>{inline(block.text)}</p>
        )
      )}
    </div>
  )
}

export default function AIAnalysis() {
  const selectedAccountId = useAuthStore((state) => state.selectedAccountId)
  const cash = useCashFlowStore()
  const scheduled = useScheduledTransactionStore((state) => state.scheduledTransactions)
  const posted = usePostedTransactions()

  const [question, setQuestion] = useState('')
  const [status, setStatus] = useState('idle')
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState('')
  const [asked, setAsked] = useState('')

  const ready = Boolean(cash.lastUpdated && selectedAccountId)

  const run = async (text) => {
    if (!ready || status === 'loading') return
    setStatus('loading')
    setError('')
    setAsked(text)

    const [month, quarter] = await Promise.all([
      getFinancialMetrics(selectedAccountId, 'month'),
      getFinancialMetrics(selectedAccountId, 3),
    ])
    const context = buildAnalysisContext({
      today: new Date(),
      cash,
      scheduled,
      posted,
      metrics: { month: month.data, quarter: quarter.data },
    })

    const result = await requestAnalysis({ context, question: text })
    if (result.success) {
      setAnalysis(result.analysis)
      setStatus('done')
    } else {
      setError(result.error)
      setStatus('error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-cream-50 border border-bronze-200 rounded-lg p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-xl">Análisis con Claude</h2>
          <p className="text-sm text-charcoal-500 mt-1">
            Claude revisa tu saldo, tu proyección a 12 meses, tus programados y tus gastos recientes, y te dice qué ve.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setQuestion(s.question)
                run(s.question)
              }}
              disabled={!ready || status === 'loading'}
              className="px-3 py-1.5 text-sm rounded-full border border-bronze-300 text-charcoal-600 hover:bg-cream-200 disabled:opacity-50"
            >
              {s.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(question)
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="O pregunta lo que quieras: ¿puedo adelantar un pago de mi préstamo?"
            className="flex-1 px-3 py-2 border border-bronze-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-bronze-400"
          />
          <button
            type="submit"
            disabled={!ready || status === 'loading'}
            className="px-5 py-2 rounded-lg bg-gold-500 text-cream-50 font-medium disabled:opacity-50"
          >
            {status === 'loading' ? 'Analizando…' : 'Analizar'}
          </button>
        </form>

        {!ready && <p className="text-sm text-charcoal-500">Calculando tu flujo de caja…</p>}

        <p className="text-xs text-charcoal-500">
          Se envía a Claude un resumen de tus finanzas (montos, fechas y descripciones de tus movimientos), sin tu correo
          ni el nombre de tu cuenta. Es orientación general, no asesoría financiera profesional.
        </p>
      </div>

      {status === 'loading' && (
        <div className="bg-cream-50 border border-bronze-200 rounded-lg p-6 text-center text-charcoal-500">
          Claude está analizando tus números… puede tardar unos 20 segundos.
        </div>
      )}

      {status === 'error' && (
        <div className="bg-burgundy-50 text-burgundy-700 border border-burgundy-200 rounded-lg p-4 text-sm">{error}</div>
      )}

      {status === 'done' && (
        <div className="bg-cream-50 border border-bronze-200 rounded-lg p-4 sm:p-6 space-y-3">
          {asked && <p className="text-xs text-charcoal-500 uppercase tracking-wide">Tu pregunta: {asked}</p>}
          <Analysis text={analysis} />
        </div>
      )}
    </div>
  )
}
