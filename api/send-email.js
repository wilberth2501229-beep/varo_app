/**
 * Serverless function para Vercel
 * Envía emails usando Resend
 *
 * Para configurar:
 * 1. npm install resend
 * 2. Agregar RESEND_API_KEY a Vercel Environment Variables
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_TEMPLATES = {
  critical_liquidity: (data) => ({
    subject: '⚠️ Alerta de Liquidez Crítica - Varo',
    html: `
      <h1>Alerta de Liquidez Crítica</h1>
      <p>Hola,</p>
      <p>Tu cuenta <strong>${data.accountName}</strong> alcanzará un nivel crítico de liquidez.</p>

      <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 16px 0;">
        <p><strong>Saldo Proyectado:</strong> $${data.projectedBalance}</p>
        <p><strong>Fecha:</strong> ${data.criticalDate}</p>
      </div>

      <p>Te recomendamos revisar tu flujo de caja y tomar acciones preventivas.</p>

      <a href="https://varoapp.vercel.app" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 16px;">
        Ir a Varo
      </a>
    `,
  }),

  scheduled_transaction: (data) => ({
    subject: `📅 ${data.transactionType} Próximo - Varo`,
    html: `
      <h1>${data.transactionType} Próximo</h1>
      <p>Hola,</p>
      <p>Te recordamos que tienes un ${data.transactionType.toLowerCase()} programado en tu cuenta <strong>${data.accountName}</strong>.</p>

      <div style="background-color: #dbeafe; border-left: 4px solid #0284c7; padding: 16px; margin: 16px 0;">
        <p><strong>Concepto:</strong> ${data.description}</p>
        <p><strong>Monto:</strong> $${data.amount}</p>
        <p><strong>Fecha:</strong> ${data.dueDate}</p>
      </div>

      <p>Asegúrate de tener suficiente saldo disponible.</p>

      <a href="https://varoapp.vercel.app" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 16px;">
        Ver Detalles
      </a>
    `,
  }),

  weekly_summary: (data) => ({
    subject: '📊 Resumen Semanal - Varo',
    html: `
      <h1>Resumen Semanal de ${data.accountName}</h1>
      <p>Hola,</p>
      <p>Aquí está tu resumen financiero de esta semana:</p>

      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 5px; margin: 16px 0;">
        <p><strong>Ingresos:</strong> $${data.income || '0.00'}</p>
        <p><strong>Gastos:</strong> $${data.expenses || '0.00'}</p>
        <p><strong>Saldo Neto:</strong> $${data.netBalance || '0.00'}</p>
        <p><strong>Balance Actual:</strong> $${data.currentBalance || '0.00'}</p>
      </div>

      <p>Sigue revisando tu flujo de caja para mantener tus finanzas bajo control.</p>

      <a href="https://varoapp.vercel.app" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 16px;">
        Abrir Varo
      </a>
    `,
  }),

  daily_digest: (data) => ({
    subject: '📬 Notificaciones - Varo',
    html: `
      <h1>Notificaciones de ${data.accountName}</h1>
      <p>Hola,</p>
      <p>Tienes nuevas notificaciones en Varo:</p>

      ${
        data.notifications
          ?.map(
            (n) => `
        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 5px; margin: 8px 0;">
          <p><strong>${n.title}</strong></p>
          <p>${n.message}</p>
        </div>
      `
          )
          .join('') || '<p>Sin notificaciones</p>'
      }

      <a href="https://varoapp.vercel.app" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 16px;">
        Ver Notificaciones
      </a>
    `,
  }),
}

export default async function handler(req, res) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { to, subject, template, data } = req.body

    // Validar datos
    if (!to || !template || !data) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Obtener template
    const emailTemplate = EMAIL_TEMPLATES[template]
    if (!emailTemplate) {
      return res.status(400).json({ error: `Template ${template} not found` })
    }

    // Generar contenido del email
    const { html } = emailTemplate(data)

    // Enviar con Resend
    const result = await resend.emails.send({
      from: 'Varo <noreply@varoapp.vercel.app>',
      to,
      subject,
      html,
    })

    return res.status(200).json({
      success: true,
      messageId: result.id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Email error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
