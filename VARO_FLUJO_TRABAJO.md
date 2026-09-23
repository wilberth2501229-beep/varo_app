# 🎨 VARO APP - Flujo de Trabajo Completo

## 📋 Visión General

**Varo** es una aplicación web para gestionar ingresos y egresos personales.

**Stack:** React + Vite + Supabase + Zustand + TailwindCSS

---

## 🎯 Estado Actual del Proyecto

### ✅ Completado
- [x] Schema de Supabase creado (tablas, triggers, RLS)
- [x] Proyecto React con Vite inicializado
- [x] Todas las dependencias instaladas
- [x] Estructura de carpetas creada
- [x] Archivos base copiados a sus carpetas
- [x] Variables de entorno configuradas (.env.local)
- [x] TailwindCSS configurado
- [x] App básico funcionando en http://localhost:5173/

### ⏳ Próximos Pasos
- [ ] Componentes UI (formulario, lista, dashboard)
- [ ] Sistema de autenticación
- [ ] Integración con Supabase (login)
- [ ] Gráficos y analytics
- [ ] Sistema de alertas visual

---

## 📁 Estructura del Proyecto

```
Desktop/
└── varo_app/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/          (Header, Sidebar)
    │   │   ├── Transactions/    (Formulario, Lista)
    │   │   ├── Analytics/       (Balance, Gráficos)
    │   │   └── Common/          (Modal, Spinner)
    │   ├── services/            ← Lógica de Supabase
    │   │   ├── supabase.js
    │   │   ├── transactionService.js
    │   │   ├── accountService.js
    │   │   └── alertService.js
    │   ├── store/               ← Estado global (Zustand)
    │   │   ├── transactionStore.js
    │   │   ├── alertStore.js
    │   │   └── uiStore.js
    │   ├── types/
    │   │   └── database.types.ts
    │   ├── utils/               ← Funciones auxiliares
    │   │   └── utils.js
    │   ├── hooks/               (custom hooks - todavía vacío)
    │   ├── App.jsx              ← Componente principal
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── .env.local               ← Credenciales de Supabase
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── vite.config.js
    ├── package.json
    └── node_modules/
```

---

## 🗂️ Descripción de Archivos Clave

### Services (src/services/)

#### `supabase.js`
```javascript
// Cliente de Supabase configurado
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(URL, KEY)
```
**Uso:** Importar `supabase` en otros servicios para hacer queries.

#### `transactionService.js`
**Métodos disponibles:**
- `getTransactions(accountId)` - Obtener todas las transacciones
- `createTransaction(transaction)` - Crear nueva transacción
- `updateTransaction(id, updates)` - Actualizar transacción
- `deleteTransaction(id)` - Eliminar transacción
- `getMonthlyTransactionSummary(accountId)` - Resumen mensual

#### `accountService.js`
**Métodos disponibles:**
- `getUserAccounts()` - Obtener cuentas del usuario
- `getAccount(accountId)` - Una cuenta específica
- `createAccount(accountData)` - Crear nueva cuenta
- `getAccountStats(accountId)` - Estadísticas de cuenta

#### `alertService.js`
**Métodos disponibles:**
- `getBudgetAlerts(accountId)` - Obtener presupuestos
- `createBudgetAlert(budgetData)` - Crear presupuesto
- `getCategorySpendingStatus(accountId, category)` - Estado de gasto
- `getBudgetSummary(accountId)` - Resumen de presupuestos

---

### Stores (src/store/)

#### `transactionStore.js` (Zustand)
```javascript
import { useTransactionStore } from './store/transactionStore'

// En componentes:
const { 
  transactions, 
  addTransaction, 
  updateTransaction,
  getTotalIncome,
  getTotalExpenses,
  getFilteredTransactions
} = useTransactionStore()
```

**Estado:**
- `transactions[]` - Lista de transacciones
- `filters{}` - Filtros aplicados
- `selectedAccount` - Cuenta seleccionada

**Métodos:**
- `setTransactions(array)` - Establecer transacciones
- `addTransaction(transaction)` - Agregar una
- `updateTransaction(id, updates)` - Actualizar una
- `deleteTransaction(id)` - Eliminar una
- `getTotalIncome()` - Total de ingresos
- `getTotalExpenses()` - Total de egresos
- `getTransactionsByCategory()` - Agrupar por categoría

#### `alertStore.js` (Zustand)
```javascript
import { useAlertStore } from './store/alertStore'

const {
  alerts,
  budgetAlerts,
  addAlert,
  dismissAlert,
  getCriticalAlerts
} = useAlertStore()
```

#### `uiStore.js` (Zustand)
```javascript
import { useUiStore } from './store/uiStore'

const {
  isFormModalOpen,
  openFormModal,
  closeFormModal,
  showSuccess,
  showError,
  notification
} = useUiStore()
```

---

### Utils (src/utils/)

#### `utils.js` - Funciones auxiliares

**Formatters:**
```javascript
formatCurrency(1500, 'MXN')           // '$ 1,500.00'
formatDate('2024-01-15')              // 'enero 15, 2024'
formatDateShort('2024-01-15')         // '15/01/2024'
capitalize('varo')                    // 'Varo'
```

**Calculators:**
```javascript
calculateTotalIncome(transactions)    // 5000
calculateTotalExpenses(transactions)  // 1200
calculateNetBalance(transactions)     // 3800
groupByCategory(transactions)         // { 'Alimentación': [...], ... }
```

**Validators:**
```javascript
isValidAmount(500)                    // true
isValidDate('2024-01-15')             // true
isValidTransactionType('expense')     // true
```

**Helpers:**
```javascript
getTransactionColor('income')         // 'text-green-600'
getCategoryIcon('Alimentación')       // '🍔'
getCurrentMonthRange()                // { start: '2024-01-01', end: '2024-01-31' }
```

---

## 🔄 Flujo de Datos

### Agregar una transacción:

```
Usuario escribe en formulario
    ↓
Click "Guardar"
    ↓
Validación local (utils.js)
    ↓
Llamar createTransaction() (transactionService.js)
    ↓
Supabase recibe datos
    ↓
Trigger actualiza balance automáticamente
    ↓
Respuesta vuelve al cliente
    ↓
addTransaction() en store (transactionStore.js)
    ↓
useTransactionStore() se actualiza
    ↓
Componentes se re-renderean
    ↓
UI muestra nueva transacción
```

### Mostrar lista de transacciones:

```
Componente monta
    ↓
useEffect llama getTransactions()
    ↓
Response del servidor
    ↓
setTransactions() en store
    ↓
getFilteredTransactions() retorna datos
    ↓
Componente renderea lista
```

---

## 🔐 Base de Datos (Supabase)

### Tablas principales:

**accounts**
```
id (UUID)
user_id (FK → auth.users)
name (string)
balance (decimal) - se actualiza automáticamente
currency (string)
created_at, updated_at
```

**transactions**
```
id (UUID)
account_id (FK)
type ('income' | 'expense')
amount (decimal)
category (string)
description (string)
transaction_date (date)
created_at, updated_at
```

**budget_alerts**
```
id (UUID)
account_id (FK)
category (string)
monthly_limit (decimal)
alert_threshold (0-100)
is_active (boolean)
```

**alert_logs**
```
id (UUID)
account_id (FK)
budget_alert_id (FK)
spent_amount (decimal)
percentage (decimal)
alert_type ('warning' | 'critical')
created_at
```

### Triggers automáticos:

- Cuando agregas una transacción → Se actualiza automáticamente el balance
- Cuando agregas un gasto → Se verifica si superó el presupuesto
- Si superó presupuesto → Se crea un registro en alert_logs

---

## 🎨 Categorías disponibles

```javascript
'Alimentación'      // 🍔
'Transporte'        // 🚗
'Entretenimiento'   // 🎬
'Servicios'         // 💡
'Salud'             // ⚕️
'Educación'         // 📚
'Otros'             // 💰
```

(Puedes agregar más en `getCategoryIcon()`)

---

## 🛠️ Cómo crear un componente UI

### Template básico:

```jsx
import { useTransactionStore } from '../store/transactionStore'
import { useUiStore } from '../store/uiStore'
import { formatCurrency } from '../utils/utils'

export default function MiComponente() {
  // 1. Importar stores
  const { transactions, getTotalIncome } = useTransactionStore()
  const { showSuccess, showError } = useUiStore()

  // 2. Lógica del componente
  const handleClick = async () => {
    try {
      // hacer algo
      showSuccess('¡Listo!')
    } catch (error) {
      showError(`Error: ${error.message}`)
    }
  }

  // 3. Renderear
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Mi Componente</h2>
      <p className="text-gray-600">
        Ingresos: {formatCurrency(getTotalIncome())}
      </p>
      <button
        onClick={handleClick}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Click me
      </button>
    </div>
  )
}
```

---

## 📚 Próximos componentes a crear

### 1. **TransactionForm.jsx** (Formulario)
- Input para monto
- Select para tipo (income/expense)
- Select para categoría
- Input para descripción
- Date picker para fecha
- Botón guardar

### 2. **TransactionList.jsx** (Lista)
- Mostrar todas las transacciones
- Filtros (categoría, tipo, fecha)
- Botones editar/eliminar

### 3. **BalanceCard.jsx** (Dashboard)
- Mostrar balance actual
- Total ingresos
- Total egresos
- Seleccionar cuenta

### 4. **AlertBadge.jsx** (Alertas)
- Mostrar alertas críticas
- Mostrar advertencias
- Botón para cerrar alerta

### 5. **SpendingChart.jsx** (Gráficos)
- Gráfico de gastos por categoría
- Gráfico de ingresos vs egresos
- Gráfico de tendencias

---

## 🚀 Cómo ejecutar

### Terminal:
```bash
cd ~/Desktop/varo_app
npm run dev
```

### Navegador:
```
http://localhost:5173/
```

### Detener:
```
Ctrl + C (en la terminal)
```

---

## 🔑 Variables de entorno (.env.local)

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtener de: Supabase → Settings → API

---

## 📊 Flujo de autenticación (Próximo)

```
Usuario hace login
    ↓
Supabase auth retorna sesión
    ↓
Guardar user en estado
    ↓
Cargar cuentas del usuario
    ↓
Mostrar dashboard con datos
```

---

## 🐛 Debugging

### Ver logs de Supabase:
```javascript
// Los servicios ya incluyen logging automático
// Abre F12 en navegador → Console
```

### Ver estado global:
```javascript
// En consola del navegador:
import { useTransactionStore } from './store/transactionStore'
useTransactionStore.getState()
```

---

## 📝 Checklist para nuevo componente

- [ ] Importar stores necesarios
- [ ] Importar servicios si necesita datos
- [ ] Importar utils para formateo
- [ ] Usar clases de TailwindCSS
- [ ] Agregar manejo de errores
- [ ] Mostrar notificaciones (showSuccess, showError)
- [ ] Actualizar stores cuando sea necesario
- [ ] Responder a cambios en mobile (responsive)

---

## 🎯 Próximas fases

**Fase 1 (Actual):** Setup y estructura ✅
**Fase 2:** Componentes UI (Próximo)
**Fase 3:** Autenticación y login
**Fase 4:** Dashboard con gráficos
**Fase 5:** Pulir y optimizar

---

## 💡 Notas importantes

1. **RLS está habilitado** - Solo usuarios pueden ver sus datos
2. **Balance se actualiza automáticamente** - Los triggers en BD lo hacen
3. **Alertas se crean automáticamente** - Cuando superas presupuesto
4. **TailwindCSS para estilos** - No uses CSS personalizado si puedes
5. **Zustand para estado** - Usa los stores, no useState local

---

## 🔗 Enlaces útiles

- Supabase docs: https://supabase.com/docs
- React docs: https://react.dev
- TailwindCSS: https://tailwindcss.com
- Zustand: https://github.com/pmndrs/zustand
- Vite: https://vitejs.dev

---

**Proyecto:** Varo App  
**Stack:** React + Vite + Supabase + Zustand + TailwindCSS  
**Estado:** En desarrollo - Fase 2 (Componentes UI)  
**Última actualización:** Septiembre 2026
