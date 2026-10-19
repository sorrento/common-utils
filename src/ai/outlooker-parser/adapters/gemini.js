/**
 * Adaptador para Google Gemini API (Multimodal SDK)
 * 
 * Convierte adjuntos binarios (PDFs, imágenes, hojas de cálculo, etc.)
 * en partes `inlineData` compatibles con `@google/generative-ai`.
 */

/**
 * Convierte un Uint8Array a cadena Base64 de forma eficiente y universal (Navegador y Node.js).
 * @param {Uint8Array} bytes 
 * @returns {string} Cadena Base64
 */
export function bytesToBase64(bytes) {
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(bytes).toString('base64');
    }

    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convierte un adjunto extraído por el parser en una parte compatible con Gemini.
 * 
 * @param {Object} attachment - Adjunto con propiedades { name, mimeType, data }
 * @returns {{ inlineData: { data: string, mimeType: string } }}
 */
export function attachmentToGeminiPart(attachment) {
    if (!attachment.data || attachment.data.length === 0) {
        throw new Error(`El adjunto "${attachment.name}" no contiene datos binarios.`);
    }

    const base64Data = bytesToBase64(attachment.data);

    return {
        inlineData: {
            data: base64Data,
            mimeType: attachment.mimeType || 'application/octet-stream',
        }
    };
}

/**
 * Prepara el contenido completo (prompt de texto + adjuntos multimedia) para Gemini API.
 * 
 * @param {Object} parsedEmail - Objeto devuelto por el parser
 * @param {Object} [options] - Opciones para el prompt y adjuntos
 * @returns {Array<string|Object>} Array de partes listo para model.generateContent(parts)
 */
export function emailToGeminiContent(parsedEmail, options = {}) {
    const { formatEmailForLLM } = options.formatter 
        ? { formatEmailForLLM: options.formatter } 
        : require?.('../adapters/llm-prompt.js') || {};

    const parts = [];

    // 1. Agregar el prompt con el correo formateado
    if (options.textPrompt) {
        parts.push(options.textPrompt);
    }

    // 2. Adjuntos multimedia seleccionados o todos los compatibles
    const attachments = parsedEmail.attachments || [];
    for (const att of attachments) {
        if (!att.data || att.size === 0) continue;

        // Filtrar adjuntos si se especifica un filtro
        if (typeof options.filterAttachment === 'function' && !options.filterAttachment(att)) {
            continue;
        }

        try {
            parts.push(attachmentToGeminiPart(att));
        } catch (e) {
            console.warn(`No se pudo convertir adjunto ${att.name} para Gemini:`, e);
        }
    }

    return parts;
}
