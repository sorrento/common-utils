/**
 * Servicio seguro de envío de correos.
 * NUNCA contiene la API key de Resend en el cliente.
 * Se comunica exclusivamente con el backend proxy (/api/send-email en dev o la Cloud Function en prod).
 */

export interface WhitelistInvitationParams {
  recipientEmail: string;
  recipientName: string;
  assignedRole: string;
  companyName: string;
  appName: string;
  appUrl?: string;
  adminEmail: string;
}

export interface UnauthorizedAlertParams {
  adminEmail: string;
  attemptEmail: string;
  attemptName?: string;
  attemptTime: string;
  appName: string;
  companyName: string;
  provider?: string;
}

export async function sendSecureEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  appName?: string;
}): Promise<boolean> {
  const { to, subject, html, from, appName } = params;

  // En localhost usa el middleware Vite /api/send-email; en producción la Cloud Function centralizada
  const endpoint = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? '/api/send-email'
    : 'https://us-central1-artbpo.cloudfunctions.net/sendEmail';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        from: from || `${appName || 'Corporate Portal'} <notificaciones@npr.cl>`,
        appName: appName || 'Corporate Portal'
      }),
    });

    if (!response.ok) {
      console.warn('[SecureEmailService] Email endpoint responded with error:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SecureEmailService] Could not reach email endpoint:', error);
    return false;
  }
}

/**
 * Notificación al Administrador ante intento no autorizado
 */
export async function sendUnauthorizedAccessAlert(params: UnauthorizedAlertParams): Promise<boolean> {
  const { adminEmail, attemptEmail, attemptName, attemptTime, appName, companyName, provider = 'Google / Microsoft SSO' } = params;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe6e3; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 32, 29, 0.08);">
      <div style="background: #10201d; padding: 24px 32px; border-bottom: 3px solid #df3f45;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">
          ${appName} <span style="color: #00bfa8; font-weight: 500; font-size: 14px;">| Alerta de Seguridad & Acceso</span>
        </h1>
      </div>
      <div style="padding: 32px; color: #10201d; line-height: 1.6;">
        <div style="display: inline-block; padding: 4px 10px; border-radius: 6px; background: rgba(223, 63, 69, 0.12); color: #df3f45; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
          ⚠️ ACCESO NO AUTORIZADO DETECTADO
        </div>
        <h2 style="margin-top: 0; font-size: 19px; color: #10201d;">Intento de Ingreso fuera de Lista Blanca</h2>
        <p style="color: #60706c; font-size: 14.5px;">
          Un usuario ha intentado autenticarse en la plataforma <strong>${appName} (${companyName})</strong> pero su correo no figura en la lista blanca de acceso corporativo.
        </p>

        <div style="background: #f7faf9; border: 1px solid #dbe6e3; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #60706c; width: 140px;"><strong>Correo Usuario:</strong></td>
              <td style="padding: 6px 0; color: #10201d; font-weight: 600;">${attemptEmail}</td>
            </tr>
            ${attemptName ? `
            <tr>
              <td style="padding: 6px 0; color: #60706c;"><strong>Nombre:</strong></td>
              <td style="padding: 6px 0; color: #10201d;">${attemptName}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #60706c;"><strong>Proveedor:</strong></td>
              <td style="padding: 6px 0; color: #10201d;">${provider}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #60706c;"><strong>Fecha y Hora:</strong></td>
              <td style="padding: 6px 0; color: #10201d;">${attemptTime}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #60706c;"><strong>Estado:</strong></td>
              <td style="padding: 6px 0; color: #df3f45; font-weight: 700;">BLOQUEADO (RECHAZADO)</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #60706c;">
          Si deseas autorizar el acceso de este usuario, ingresa como Administrador a <strong>${appName}</strong> en la pestaña <strong>Users</strong> y agrégalo a la lista blanca.
        </p>
      </div>
      <div style="background: #f1f5f4; padding: 16px 32px; border-top: 1px solid #dbe6e3; font-size: 12px; color: #60706c; text-align: center;">
        ${appName} · ${companyName} · Sistema centralizado de seguridad
      </div>
    </div>
  `;

  return sendSecureEmail({
    to: adminEmail,
    subject: `🚨 [${appName}] Intento de acceso no autorizado: ${attemptEmail}`,
    html,
    appName
  });
}

/**
 * Invitación por email al usuario autorizado
 */
export async function sendWhitelistInvitationEmail(params: WhitelistInvitationParams): Promise<boolean> {
  const { recipientEmail, recipientName, assignedRole, companyName, appName, appUrl = window.location.origin } = params;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe6e3; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 32, 29, 0.08);">
      <div style="background: #10201d; padding: 28px 32px; border-bottom: 3px solid #00bfa8;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
          ${appName} <span style="color: #00bfa8; font-weight: 500; font-size: 15px;">| Invitación de Acceso</span>
        </h1>
      </div>
      <div style="padding: 32px; color: #10201d; line-height: 1.6;">
        <h2 style="margin-top: 0; font-size: 20px; color: #008b7e;">¡Bienvenido a ${appName}!</h2>
        <p style="font-size: 15px;">Estimado/a <strong>${recipientName || 'Colega'}</strong>,</p>
        <p style="color: #60706c; font-size: 14.5px;">
          Te informamos que tu cuenta ha sido autorizada e incluida en la lista blanca de acceso a la plataforma <strong>${appName}</strong> para <strong>${companyName}</strong>.
        </p>

        <div style="background: #f7faf9; border: 1px solid #dbe6e3; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #60706c; width: 140px;"><strong>Correo autorizado:</strong></td>
              <td style="padding: 6px 0; color: #10201d; font-weight: 600;">${recipientEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #60706c;"><strong>Rol asignado:</strong></td>
              <td style="padding: 6px 0; color: #008b7e; font-weight: 700;">${assignedRole}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #60706c;"><strong>Métodos de acceso:</strong></td>
              <td style="padding: 6px 0; color: #10201d;">Google Workspace o Microsoft 365 Entra ID</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14.5px; color: #60706c;">
          Ya puedes acceder directamente con tu cuenta institucional seleccionando tu proveedor en la pantalla de inicio:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="display: inline-block; background: #00bfa8; color: #10201d; font-weight: 800; font-size: 15px; padding: 13px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 14px rgba(0, 191, 168, 0.4);">
            Ingresar a ${appName}
          </a>
        </div>
      </div>
      <div style="background: #f1f5f4; padding: 16px 32px; border-top: 1px solid #dbe6e3; font-size: 12px; color: #60706c; text-align: center;">
        ${appName} · ${companyName} · Notificación corporativa confidencial
      </div>
    </div>
  `;

  return sendSecureEmail({
    to: recipientEmail,
    subject: `🌟 Acceso Autorizado a ${appName} (${companyName})`,
    html,
    appName
  });
}
