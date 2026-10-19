/**
 * Outlooker Parser - TypeScript Bridge & Utilities
 */

// @ts-ignore - JavaScript ESM module
import { parseEmail as _parseEmail, parseEmailFile as _parseEmailFile, formatEmailForLLM as _formatEmailForLLM } from './outlooker-core.js';
import type { Attachment, ParsedEmail, ParseEmailOptions, FormatEmailOptions } from './types/index.js';

export type { Attachment, ParsedEmail, ParseEmailOptions, FormatEmailOptions };

export const parseEmail: (
  input: File | Blob | ArrayBuffer | Uint8Array | string,
  options?: ParseEmailOptions | string
) => Promise<ParsedEmail> = _parseEmail;

export const parseEmailFile: (
  input: File | Blob | ArrayBuffer,
  fileName?: string
) => Promise<ParsedEmail> = _parseEmailFile;

export const formatEmailForLLM: (
  parsedEmail: ParsedEmail,
  options?: FormatEmailOptions
) => string = _formatEmailForLLM;

/**
 * Convierte un Attachment extraído por Outlooker en un File estándar del navegador
 */
export function attachmentToFile(att: Attachment): File {
  const mimeType = att.mimeType || 'application/octet-stream';
  const data = att.data || new Uint8Array(0);
  return new File([data as any], att.name, { type: mimeType });
}

/**
 * Detecta si un archivo es un correo electrónico (.msg o .eml) por extensión o MIME
 */
export function isEmailFile(file: File): boolean {
  if (!file || !file.name) return false;
  const lower = file.name.toLowerCase();
  return lower.endsWith('.msg') || lower.endsWith('.eml') || file.type === 'message/rfc822' || file.type === 'application/vnd.ms-outlook';
}

/**
 * Comprueba los Magic Bytes para saber si un buffer es un archivo .msg OLE binario (D0 CF 11 E0)
 */
export function isOleMsgBuffer(buffer: ArrayBuffer | Uint8Array): boolean {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return (
    bytes.length >= 4 &&
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  );
}
