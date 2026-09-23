# 📱 Guía de Responsividad - Varo

**Versión**: 1.0  
**Actualizado**: 2026-09-23  
**Stack**: Tailwind CSS + React

---

## 🎯 Breakpoints Utilizados

Varo usa los breakpoints estándar de Tailwind CSS:

| Breakpoint | Ancho | Dispositivo | Uso |
|---|---|---|---|
| `(sin prefijo)` | < 640px | Mobile | Base (mobile-first) |
| `sm:` | ≥ 640px | Tablet pequeña | Ajustes iniciales |
| `md:` | ≥ 768px | Tablet | Layouts más complejos |
| `lg:` | ≥ 1024px | Desktop | 2-3 columnas |
| `xl:` | ≥ 1280px | Desktop grande | Layouts complejos |

---

## 📐 Patrones Responsive Comunes

### 1. Grid Responsive (Lo Más Importante)

**❌ MAL** - No es responsive:
```jsx
<div className="grid grid-cols-2 gap-4">
  <Card />
  <Card />
</div>
```

**✅ BIEN** - Responsive en móvil:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

**Patrones Comunes:**
```javascript
// 2 columnas desktop, 1 mobile
"grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"

// 3 columnas desktop, 1 tablet, 1 mobile
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"

// 4 columnas, responsive
"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"

// Full width en mobile, 2 columnas en desktop
"grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"

// Sidebar pattern: full width mobile, 3:1 en desktop
"grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
// con col-span: "lg:col-span-2"
```

### 2. Padding/Spacing Responsive

**❌ MAL** - Padding fijo:
```jsx
<div className="px-4 py-8">
  Content
</div>
```

**✅ BIEN** - Padding responsive:
```jsx
<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
  Content
</div>
```

### 3. Texto Responsive

**❌ MAL** - Tamaño fijo:
```jsx
<h1 className="text-3xl font-bold">Título</h1>
```

**✅ BIEN** - Tamaño responsive:
```jsx
<h1 className="text-2xl sm:text-3xl font-bold">Título</h1>
```

**Escalas Comunes:**
```javascript
// Títulos principales
"text-2xl sm:text-3xl font-bold"

// Subtítulos
"text-base sm:text-lg font-bold"

// Cuerpo
"text-sm sm:text-base"

// Pequeño
"text-xs sm:text-sm"
```

### 4. Ocultar/Mostrar según Pantalla

```jsx
// Mostrar solo en mobile
<span className="sm:hidden">📊</span>

// Mostrar solo en desktop
<span className="hidden sm:inline">Resumen Detallado</span>

// Cambiar entre mobile y desktop
<div className="block sm:hidden">
  Mobile layout
</div>
<div className="hidden sm:block">
  Desktop layout
</div>
```

### 5. Flexbox Responsive

**❌ MAL**:
```jsx
<div className="flex items-center justify-between">
  // Siempre flex, podría ser un column en mobile
</div>
```

**✅ BIEN**:
```jsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
  // Column en mobile, row en desktop
</div>
```

### 6. Overflow para Tablas/Gráficos

En mobile, tablas largas necesitan scroll:

```jsx
<div className="overflow-x-auto">
  <table>
    {/* Contenido */}
  </table>
</div>
```

---

## 🔄 Componentes Responsivos en Varo

### CashFlow.jsx
```javascript
// Header responsive
"px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
"flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"

// Tabs con scroll en mobile
"overflow-x-auto"
"flex gap-2 sm:gap-6 min-w-max sm:min-w-0"

// Grids
"grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
```

### FinancialMetrics.jsx
```javascript
// 1 columna mobile, 2 tablet, 3 desktop
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"

// Card con span-2 en tablet
"sm:col-span-2 lg:col-span-3"
```

### TransactionScheduler.jsx
```javascript
// Formulario responsivo
"grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"

// Padding responsivo
"p-4 sm:p-6"

// Tamaño de título
"text-lg sm:text-xl font-bold"
```

---

## 📏 Guía de Tamaños

### Padding/Margen
```javascript
// Mobile
p-4, px-4, py-4, gap-3, gap-4

// Desktop
sm:p-6, sm:px-6, sm:py-6, sm:gap-4, sm:gap-6
```

### Ancho de Contenedor
```javascript
// Siempre usar max-w-7xl para ancho máximo
"max-w-7xl mx-auto"

// Con padding responsivo
"px-4 sm:px-6 lg:px-8"
```

### Tamaño de Texto
```javascript
// Body text
"text-sm sm:text-base"

// Labels/small
"text-xs sm:text-sm"

// Headings
h1: "text-2xl sm:text-3xl"
h2: "text-lg sm:text-xl"
h3: "text-base sm:text-lg"
```

---

## ✅ Checklist para Nueva Feature

Antes de mergear, verificar:

- [ ] **Mobile (375px)**: ¿Se ve bien en pantalla pequeña?
- [ ] **Tablet (768px)**: ¿Los grids se adaptan correctamente?
- [ ] **Desktop (1024px+)**: ¿Usa el espacio disponible?
- [ ] **Textos**: ¿Los títulos se leen bien en mobile?
- [ ] **Botones**: ¿Son clickeables en mobile (min 44x44)?
- [ ] **Tablas**: ¿Tienen scroll horizontal si es necesario?
- [ ] **Padding**: ¿No hay contenido pegado al borde?
- [ ] **Grids**: ¿Usan breakpoints correctamente?

---

## 🧪 Testing en Diferentes Pantallas

### DevTools de Chrome/Firefox
```
F12 → Toggle device toolbar (Ctrl+Shift+M)
```

### Tamaños a Testear
```
Mobile:     375x667 (iPhone SE)
Mobile+:    414x896 (iPhone 11)
Tablet:     768x1024 (iPad)
Laptop:     1366x768
4K:         1920x1080+
```

---

## 🎨 Mobile-First vs Desktop-First

**Varo usa MOBILE-FIRST**:

```jsx
// ✅ Correcto: Empezar sin prefijo (mobile), agregar breakpoints
<div className="grid grid-cols-1 sm:grid-cols-2">
  // 1 col por defecto, 2 cols en sm+
</div>

// ❌ Incorrecto: Usar max- (desktop-first)
<div className="grid md:grid-cols-1 grid-cols-2">
  // Confuso y difícil de mantener
</div>
```

---

## 📚 Componentes de Referencia

### ✅ Bien Implementados
- **CashFlow.jsx**: Header responsive, tabs con scroll
- **FinancialMetrics.jsx**: Grid 1-2-3 columnas
- **TransactionScheduler.jsx**: Formulario adaptable

### 🔧 En Mejora
- **ScheduledTransactionList.jsx**: Tabla podría mejorar en mobile
- **CashFlowChart.jsx**: SVG podría ser más responsive

---

## 🚀 Mejoras Futuras

- [ ] Usar `mobile-web` component library (Radix UI, Headless UI)
- [ ] Agregar pruebas de responsividad automáticas
- [ ] Crear componentes reutilizables para layouts comunes
- [ ] Mejorar tablas con componentes virtualizados
- [ ] Testing en navegadores reales (BrowserStack, etc.)

---

## 💡 Tips and Tricks

### Espaçado Consistente
```javascript
// Siempre escalar gaps y padding juntos
"gap-3 sm:gap-4 md:gap-6"   // ✅ Buen ritmo
"gap-3 sm:gap-8 md:gap-10"  // ❌ Muy irregular
```

### Container Queries (Futuro)
```javascript
// Tailwind 3.2+ soporta @container
// Permite responsividad basada en contenedor, no viewport
"@container/main grid @sm/main:grid-cols-2"
```

### Debugging
```jsx
// Mostrar breakpoint actual
<div className="fixed top-0 right-0 bg-black text-white p-2 text-xs">
  <span className="inline sm:hidden">XS</span>
  <span className="hidden sm:inline md:hidden">SM</span>
  <span className="hidden md:inline lg:hidden">MD</span>
  <span className="hidden lg:inline xl:hidden">LG</span>
  <span className="hidden xl:inline">XL</span>
</div>
```

---

## 📖 Recursos

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Mobile-First CSS](https://www.mobileapproach.com/)
- [Google Material Design - Responsive](https://material.io/design/layout/responsive-layout-grid.html)

---

## 🎯 Resumen Rápido

1. **Siempre empezar mobile**: `grid-cols-1` luego `sm:grid-cols-2`
2. **Escalar padding**: `px-4 sm:px-6 lg:px-8`
3. **Escalar texto**: `text-sm sm:text-base md:text-lg`
4. **Usar gaps responsivos**: `gap-3 sm:gap-4 md:gap-6`
5. **Testear en 3 tamaños**: 375px, 768px, 1024px
6. **Si está roto en mobile, es prioridad 0**

---

**Última revisión**: 2026-09-23  
**Mantenedor**: Claude Haiku 4.5
