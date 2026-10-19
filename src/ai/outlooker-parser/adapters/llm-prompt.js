/**
 * Formateador de correos electrónicos para Modelos de Lenguaje (LLMs)
 * 
 * Prepara un prompt con metadatos limpios y el cuerpo del mensaje
 * listo para enviar a GPT-4, Claude, Gemini, Mistral o modelos locales.
 */

/**
 * Convierte un objeto ParsedEmail en un prompt de texto claro y estructurado.
 * 
 * @param {Object} parsedEmail - Correo parseado devuelto por MsgParser o EmlParser
 * @param {Object} [options] - Opciones de formato
 * @param {boolean} [options.includeHeaders=false] - Si incluye cabeceras de transporte
 * @param {boolean} [options.preferHtml=false] - Si prefiere el cuerpo HTML en lugar del texto plano
 * @param {number} [options.maxBodyLength=0] - Límite de caracteres para el cuerpo (0 = sin límite)
 * @returns {string} Texto formateado para el contexto del LLM
 */
export function formatEmailForLLM(parsedEmail, options = {}) {
    const {
        includeHeaders = false,
        preferHtml = false,
        maxBodyLength = 0
    } = options;

    const dateFormatted = parsedEmail.dateSent instanceof Date && !isNaN(parsedEmail.dateSent.getTime())
        ? parsedEmail.dateSent.toISOString()
        : 'Desconocida';

    let bodyText = preferHtml && parsedEmail.bodyHtml 
        ? parsedEmail.bodyHtml 
        : (parsedEmail.body || parsedEmail.bodyHtml || '(Cuerpo vacío)');

    if (maxBodyLength > 0 && bodyText.length > maxBodyLength) {
        bodyText = bodyText.substring(0, maxBodyLength) + '\n... [Cuerpo truncado por límite de tamaño]';
    }

    let prompt = `--- DETALLES DEL EMAIL ---
De: ${parsedEmail.from || '(Desconocido)'}
Para: ${parsedEmail.to || '(Ninguno)'}
CC: ${parsedEmail.cc || '(Ninguno)'}
Fecha: ${dateFormatted}
Asunto: ${parsedEmail.subject || '(Sin asunto)'}`;

    if (parsedEmail.attachments && parsedEmail.attachments.length > 0) {
        prompt += `\nAdjuntos detectados (${parsedEmail.attachments.length}):`;
        for (const att of parsedEmail.attachments) {
            prompt += `\n  - ${att.name} (${att.mimeType || 'desconocido'}, ${att.size} bytes)`;
        }
    }

    if (includeHeaders && parsedEmail.headers) {
        prompt += `\n\n--- CABECERAS DE TRANSPORTE ---\n${parsedEmail.headers}`;
    }

    prompt += `\n\n--- CUERPO DEL EMAIL ---\n${bodyText}\n--------------------------`;

    return prompt;
}
