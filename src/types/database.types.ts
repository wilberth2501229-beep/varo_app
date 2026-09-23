/**
 * TIPOS DE BASE DE DATOS
 * Esta es la estructura de tipos para toda la base de datos
 * Útil para TypeScript o documentación
 */

// Tabla: accounts (Cuentas)
export interface Account {
  id: string // UUID
  user_id: string // UUID
  name: string
  balance: number // decimal(15,2)
  currency: string // 'MXN', 'USD', etc.
  description?: string
  is_active: boolean
  created_at: string // timestamp
  updated_at: string // timestamp
}

// Tabla: transactions (Movimientos)
export interface Transaction {
  id: string // UUID
  account_id: string // UUID (FK)
  type: 'income' | 'expense'
  amount: number // decimal(15,2)
  category: string // Ej: 'Alimentación', 'Transporte'
  description?: string
  transaction_date: string // DATE (YYYY-MM-DD)
  created_at: string // timestamp
  updated_at: string // timestamp
}

// Tabla: budget_alerts (Alertas de presupuesto)
export interface BudgetAlert {
  id: string // UUID
  account_id: string // UUID (FK)
  category: string
  monthly_limit: number // decimal(15,2)
  alert_threshold: number // 0-100 (porcentaje)
  is_active: boolean
  created_at: string // timestamp
  updated_at: string // timestamp
}

// Tabla: alert_logs (Registro de alertas disparadas)
export interface AlertLog {
  id: string // UUID
  account_id: string // UUID (FK)
  budget_alert_id: string // UUID (FK)
  spent_amount: number // decimal(15,2)
  limit_amount: number // decimal(15,2)
  percentage: number // decimal(5,2)
  alert_type: 'warning' | 'critical'
  created_at: string // timestamp
}

// ============================================
// VISTAS (Views)
// ============================================

// Vista: transaction_summary_monthly
export interface TransactionSummaryMonthly {
  account_id: string
  category: string
  type: 'income' | 'expense'
  month: string // DATE
  total_amount: number
  transaction_count: number
  avg_amount: number
}

// Vista: transaction_summary_weekly
export interface TransactionSummaryWeekly {
  account_id: string
  category: string
  type: 'income' | 'expense'
  week_start: string // DATE
  total_amount: number
  transaction_count: number
  avg_amount: number
}

// Vista: transaction_summary_daily
export interface TransactionSummaryDaily {
  account_id: string
  category: string
  type: 'income' | 'expense'
  transaction_date: string // DATE
  total_amount: number
  transaction_count: number
  avg_amount: number
}

// Vista: active_alerts
export interface ActiveAlert {
  id: string
  account_id: string
  category: string
  spent_amount: number
  limit_amount: number
  percentage: number
  alert_type: 'warning' | 'critical'
  created_at: string
}

// ============================================
// TIPOS PARA COMPONENTES Y ESTADO
// ============================================

// Request para crear transacción
export interface CreateTransactionRequest {
  account_id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description?: string
  transaction_date: string // YYYY-MM-DD
}

// Request para actualizar transacción
export interface UpdateTransactionRequest {
  type?: 'income' | 'expense'
  amount?: number
  category?: string
  description?: string
  transaction_date?: string
}

// Request para crear presupuesto
export interface CreateBudgetAlertRequest {
  account_id: string
  category: string
  monthly_limit: number
  alert_threshold: number // 0-100
}

// Response genérico
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Estado de gasto por categoría
export interface CategorySpendingStatus {
  category: string
  spent: number
  limit: number
  remaining: number
  percentage: number
  isExceeded: boolean
  isCritical: boolean
  isWarning: boolean
  monthStart: string
  monthEnd: string
}

// Resumen de cuenta
export interface AccountStats {
  balance: number
  currency: string
  totalIncome: number
  totalExpenses: number
  netIncome: number
  transactionCount: number
}

// Categorías válidas
export type Category =
  | 'Alimentación'
  | 'Transporte'
  | 'Entretenimiento'
  | 'Servicios'
  | 'Salud'
  | 'Educación'
  | 'Otros'

// Tipos de transacción
export type TransactionType = 'income' | 'expense'

// Tipos de alerta
export type AlertType = 'warning' | 'critical'
