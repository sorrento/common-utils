/**
 * Outlooker Parser Core
 * 
 * Librería universal para procesar correos electrónicos .MSG (Outlook) y .EML (Gmail/MIME).
 * 100% Client-Side y compatible con Node.js, sin dependencias externas.
 */

import { OLEReader } from './ole/ole-reader.js';
import { RTFDecompressor } from './ole/rtf-decompressor.js';
import { MSG_PROPERTIES, ATTACHMENT_PROPERTIES, MAPI_TYPES } from './ole/mapi-tags.js';
import { MsgParser } from './parsers/msg-parser.js';
import { EmlParser } from './parsers/eml-parser.js';
import { formatEmailForLLM } from './adapters/llm-prompt.js';
import { attachmentToGeminiPart, bytesToBase64, emailToGeminiContent } from './adapters/gemini.js';

// Re-exportar clases y utilidades individuales para uso avanzado
export {
    OLEReader,
    RTFDecompressor,
    MSG_PROPERTIES,
    ATTACHMENT_PROPERTIES,
    MAPI_TYPES,
    MsgParser,
    EmlParser,
    formatEmailForLLM,
    attachmentToGeminiPart,
    bytesToBase64,
    emailToGeminiContent,
};

/**
 * Función universal para parsear un archivo de correo electrónico (.msg o .eml).
 * 
 * Detecta automáticamente si el archivo es un correo Outlook (.msg binario)
 * inspeccionando los bytes mágicos de Microsoft OLE (0xD0CF11E0), o si es
 * un correo en formato texto/MIME (.eml).
 * 
 * @param {File|Blob|ArrayBuffer|Uint8Array|string} input - Correo a decodificar.
 * @param {Object|string} [options={}] - Opciones de parseo o nombre del archivo (string para retrocompatibilidad).
 * @param {string} [options.fileName=''] - Nombre del archivo para detección por extensión.
 * @returns {Promise<import('../types').ParsedEmail>} Resultado estructurado del correo.
 */
export async function parseEmail(input, options = {}) {
    const fileName = typeof options === 'string' ? options : (options?.fileName || '');
    let buffer;
    let detectedName = fileName;

    // 1. Manejo de tipos de entrada en Navegador o Node.js
    if (typeof File !== 'undefined' && input instanceof File) {
        buffer = await input.arrayBuffer();
        if (!detectedName) detectedName = input.name;
    } else if (typeof Blob !== 'undefined' && input instanceof Blob) {
        buffer = await input.arrayBuffer();
    } else if (input instanceof ArrayBuffer) {
        buffer = input;
    } else if (ArrayBuffer.isView(input)) {
        buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    } else if (typeof input === 'string') {
        const parser = new EmlParser(input);
        return parser.getResult();
    } else {
        throw new TypeError(
            'El parámetro de entrada debe ser un File, Blob, ArrayBuffer, Uint8Array, Buffer o string.'
        );
    }

    const u8 = new Uint8Array(buffer);

    // 2. Comprobar firma mágica de archivo OLE/MSG: 0xD0, 0xCF, 0x11, 0xE0
    const isMsg = u8.length >= 4 &&
        u8[0] === 0xD0 &&
        u8[1] === 0xCF &&
        u8[2] === 0x11 &&
        u8[3] === 0xE0;

    const lowerName = (detectedName || '').toLowerCase();

    // 3. Decodificar según formato
    if (isMsg || lowerName.endsWith('.msg')) {
        const parser = new MsgParser(buffer);
        return parser.getResult();
    } else {
        const parser = new EmlParser(buffer);
        return parser.getResult();
    }
}

/**
 * Alias retrocompatible para parseEmail
 * @param {File|Blob|ArrayBuffer} input 
 * @param {string} [fileName] 
 * @returns {Promise<import('../types').ParsedEmail>}
 */
export async function parseEmailFile(input, fileName = '') {
    return parseEmail(input, { fileName });
}

export default parseEmail;
