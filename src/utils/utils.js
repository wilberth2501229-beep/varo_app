/**
 * UTILIDADES - Funciones de formateo, cálculos y validaciones
 */

// ============================================
// FORMATTERS (Formateo de datos)
// ============================================

/**
 * Formatear número a moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (ej: 'MXN', 'USD')
 * @param {string} locale - Locale para formato (ej: 'es-MX', 'en-US')
 * @returns {string} Cantidad formateada como moneda
 */
export function formatCurrency(amount, currency = 'MXN', locale = 'es-MX') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Formatear fecha a formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Locale para formato (ej: 'es-MX', 'en-US')
 * @returns {string} Fecha formateada
 */
// "YYYY-MM-DD" se interpreta como fecha local; new Date() la leería como UTC y en México mostraría el día anterior
function toDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date)
}

export function formatDate(date, locale = 'es-MX') {
  return toDate(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Formatear fecha corta (DD/MM/YYYY)
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha en formato corto
 */
export function formatDateShort(date) {
  const d = toDate(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formatear fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Locale para formato
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(date, locale = 'es-MX') {
  return new Date(date).toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Obtener nombre del mes
 * @param {number} monthIndex - Índice del mes (0-11)
 * @param {string} locale - Locale
 * @returns {string} Nombre del mes
 */
export function getMonthName(monthIndex, locale = 'es-MX') {
  return new Date(2000, monthIndex, 1).toLocaleDateString(locale, {
    month: 'long',
  })
}

/**
 * Obtener nombre del día
 * @param {string|Date} date - Fecha
 * @param {string} locale - Locale
 * @returns {string} Nombre del día
 */
export function getDayName(date, locale = 'es-MX') {
  return new Date(date).toLocaleDateString(locale, {
    weekday: 'long',
  })
}

/**
 * Truncar texto a longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * Capitalizar primera letra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// ============================================
// CALCULATORS (Cálculos)
// ============================================

/**
 * Calcular promedio
 * @param {number[]} numbers - Array de números
 * @returns {number} Promedio
 */
export function calculateAverage(numbers) {
  if (numbers.length === 0) return 0
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

/**
 * Calcular total ingresos
 * @param {Array} transactions - Array de transacciones
 * @returns {number} Total de ingresos
 */
export function calculateTotalIncome(transactions) {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

/**
 * Calcular total egresos
 * @param {Array} transactions - Array de transacciones
 * @returns {number} Total de egresos
 */
export function calculateTotalExpenses(transactions) {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

/**
 * Calcular balance neto
 * @param {Array} transactions - Array de transacciones
 * @returns {number} Balance neto
 */
export function calculateNetBalance(transactions) {
  const income = calculateTotalIncome(transactions)
  const expenses = calculateTotalExpenses(transactions)
  return income - expenses
}

/**
 * Agrupar transacciones por categoría
 * @param {Array} transactions - Array de transacciones
 * @returns {Object} Objeto con categorías como claves
 */
export function groupByCategory(transactions) {
  return transactions.reduce((acc, transaction) => {
    const category = transaction.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(transaction)
    return acc
  }, {})
}

/**
 * Agrupar transacciones por fecha
 * @param {Array} transactions - Array de transacciones
 * @returns {Object} Objeto con fechas como claves
 */
export function groupByDate(transactions) {
  return transactions.reduce((acc, transaction) => {
    const date = transaction.transaction_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(transaction)
    return acc
  }, {})
}

/**
 * Calcular porcentaje
 * @param {number} part - Parte
 * @param {number} whole - Total
 * @returns {number} Porcentaje (0-100)
 */
export function calculatePercentage(part, whole) {
  if (whole === 0) return 0
  return (part / whole) * 100
}

/**
 * Obtener el mes actual como string YYYY-MM
 * @returns {string} Mes actual en formato YYYY-MM
 */
export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Obtener el rango de fechas del mes actual
 * @returns {Object} { start, end } en formato YYYY-MM-DD
 */
export function getCurrentMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

/**
 * Obtener el rango de fechas de la semana actual
 * @returns {Object} { start, end } en formato YYYY-MM-DD
 */
export function getCurrentWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const start = new Date(now)
  start.setDate(now.getDate() - dayOfWeek)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// ============================================
// VALIDATORS (Validaciones)
// ============================================

/**
 * Validar que amount sea un número positivo
 * @param {*} amount - Valor a validar
 * @returns {boolean}
 */
export function isValidAmount(amount) {
  return typeof amount === 'number' && amount > 0 && !isNaN(amount)
}

/**
 * Validar que la fecha sea válida
 * @param {*} date - Fecha a validar
 * @returns {boolean}
 */
export function isValidDate(date) {
  const d = new Date(date)
  return d instanceof Date && !isNaN(d)
}

/**
 * Validar que la categoría sea válida
 * @param {string} category - Categoría a validar
 * @returns {boolean}
 */
export function isValidCategory(category) {
  const validCategories = [
    'Alimentación',
    'Transporte',
    'Entretenimiento',
    'Servicios',
    'Salud',
    'Educación',
    'Otros',
  ]
  return typeof category === 'string' && validCategories.includes(category)
}

/**
 * Validar que el tipo de transacción sea válido
 * @param {string} type - Tipo de transacción
 * @returns {boolean}
 */
export function isValidTransactionType(type) {
  return type === 'income' || type === 'expense'
}

/**
 * Validar que UUID sea válido
 * @param {string} uuid - UUID a validar
 * @returns {boolean}
 */
export function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// ============================================
// OTROS HELPERS
// ============================================

/**
 * Determinar el color según el tipo de transacción
 * @param {string} type - Tipo de transacción ('income' o 'expense')
 * @returns {string} Clase de color
 */
export function getTransactionColor(type) {
  return type === 'income' ? 'text-green-600' : 'text-red-600'
}

/**
 * Obtener ícono según categoría
 * @param {string} category - Categoría
 * @returns {string} Emoji o icono
 */
export function getCategoryIcon(category) {
  const icons = {
    'Alimentación': '🍔',
    'Transporte': '🚗',
    'Entretenimiento': '🎬',
    'Servicios': '💡',
    'Salud': '⚕️',
    'Educación': '📚',
    'Otros': '💰',
  }
  return icons[category] || '💰'
}

/**
 * Generar ID temporal para optimistic updates
 * @returns {string} ID único
 */
export function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
