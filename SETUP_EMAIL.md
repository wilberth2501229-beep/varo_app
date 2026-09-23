# 📧 Configuración de Notificaciones por Email

Para habilitar las notificaciones por email en Varo, necesitas configurar **Resend** en Vercel.

## 🚀 Pasos de Configuración

### 1. Instalar Resend localmente
```bash
npm install resend
```

### 2. Crear cuenta en Resend
- Ir a https://resend.com
- Crear una cuenta gratuita
- Obtener tu **API Key**

### 3. Agregar API Key a Vercel

#### Opción A: Dashboard de Vercel
1. Ir a https://vercel.com/dashboard
2. Selecciona tu proyecto `varo_app`
3. Settings → Environment Variables
4. Agregar variable:
   - **Name:** `RESEND_API_KEY`
   - **Value:** Tu API key de Resend
   - **Environments:** Production, Preview, Development
5. Click "Save"

#### Opción B: CLI de Vercel
```bash
vercel env add RESEND_API_KEY
# Pegar tu API key cuando lo pida
```

### 4. Redeploy en Vercel
```bash
git push origin main
# O hacer redeploy desde el dashboard
```

## ✅ Verificar que funciona

1. Abre https://varoapp.vercel.app
2. Navega a **Flujo de Caja** → **Configuración**
3. Actualiza el **Saldo Crítico** a un valor bajo
4. Las notificaciones de email deberían enviarse automáticamente

## 📧 Tipos de Notificaciones

| Tipo | Evento | Destinatario |
|------|--------|--------------|
| **Liquidez Crítica** | Saldo proyectado cae bajo umbral | Propietario de la cuenta |
| **Transacción Próxima** | Gasto/ingreso programado en 7 días | Propietario de la cuenta |
| **Resumen Semanal** | Cada lunes | Propietario de la cuenta |
| **Digesto Diario** | A las 8am | Propietario de la cuenta |

## 🔧 Troubleshooting

### "RESEND_API_KEY no definida"
- Verifica que agregaste la variable a Vercel Environment Variables
- Haz redeploy después de agregar la variable
- Espera 2-3 minutos para que se propague

### "Email no se envía"
- Verifica que tu API key es válida en https://resend.com/api-keys
- Revisa los logs en Vercel: Deployments → Function Logs
- Confirma que el email destino es válido

### "Error 500 en /api/send-email"
- Verifica que `resend` está instalado: `npm list resend`
- Revisa que `api/send-email.js` existe en el proyecto
- Haz redeploy: `git push origin main`

## 📝 Personalización

### Agregar nuevo template
1. Edita `api/send-email.js`
2. Agrega nuevo template a `EMAIL_TEMPLATES`
3. Usa en `src/services/emailService.js`

Ejemplo:
```javascript
// En api/send-email.js
my_template: (data) => ({
  subject: 'Mi Template',
  html: `<h1>${data.title}</h1>...`
})

// En emailService.js
export async function sendMyEmail(email, data) {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      template: 'my_template',
      data
    })
  })
  return response.json()
}
```

## 💡 Notas Importantes

- Los emails se envían desde `noreply@varoapp.vercel.app`
- Resend ofrece 100 emails gratis/día en el plan free
- Para producción considera actualizar a plan de pago
- Todos los emails incluyen link a https://varoapp.vercel.app

## 🎯 Próximas Mejoras

- [ ] Agregar preferencias de notificación por usuario
- [ ] Webhook de Resend para rastrear delivery
- [ ] Historial de emails enviados en DB
- [ ] Templating HTML más avanzado
- [ ] Soporte para múltiples idiomas en emails
