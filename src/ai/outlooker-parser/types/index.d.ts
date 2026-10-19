/**
 * Definiciones de tipos TypeScript para Outlooker Parser
 */

export interface Attachment {
    /** Nombre del archivo adjunto */
    name: string;
    /** Tipo MIME detectado (ej. 'application/pdf', 'image/png') */
    mimeType: string;
    /** Tamaño en bytes */
    size: number;
    /** Identificador de contenido (para imágenes inline en HTML: cid:...) */
    contentId?: string;
    /** Contenido binario del archivo */
    data: Uint8Array | null;
}

export interface ParsedEmail {
    /** Asunto del correo electrónico */
    subject: string;
    /** Remitente en formato "Nombre <email>" o nombre simple */
    from: string;
    /** Destinatarios principales */
    to: string;
    /** Destinatarios en copia */
    cc: string;
    /** Destinatarios en copia oculta */
    bcc: string;
    /** Cuerpo del mensaje en texto plano */
    body: string;
    /** Cuerpo del mensaje en HTML (si existe) */
    bodyHtml: string;
    /** Cabeceras RFC 822 / MAPI de transporte crudas */
    headers: string;
    /** Fecha de envío del correo */
    dateSent: Date | null;
    /** Fecha de recepción (en archivos .msg) */
    dateReceived: Date | null;
    /** Lista de archivos adjuntos */
    attachments: Attachment[];
}

export interface ParseEmailOptions {
    /** Nombre opcional del archivo para forzar detección por extensión */
    fileName?: string;
}

export interface FormatEmailOptions {
    /** Incluir cabeceras crudas en el prompt */
    includeHeaders?: boolean;
    /** Preferir cuerpo HTML en vez de texto plano */
    preferHtml?: boolean;
    /** Longitud máxima en caracteres del cuerpo del mensaje antes de truncar */
    maxBodyLength?: number;
}

export interface GeminiInlineDataPart {
    inlineData: {
        data: string;
        mimeType: string;
    };
}

/**
 * Parsea un correo electrónico (.msg o .eml) desde un archivo, blob, buffer o texto.
 */
export function parseEmail(
    input: File | Blob | ArrayBuffer | Uint8Array | string,
    options?: ParseEmailOptions | string
): Promise<ParsedEmail>;

/**
 * Alias retrocompatible para parseEmail.
 */
export function parseEmailFile(
    input: File | Blob | ArrayBuffer,
    fileName?: string
): Promise<ParsedEmail>;

/**
 * Da formato de texto limpio al correo para enviarlo a un LLM como prompt.
 */
export function formatEmailForLLM(
    parsedEmail: ParsedEmail,
    options?: FormatEmailOptions
): string;

/**
 * Convierte un adjunto a Base64 y lo empaqueta para la API de Gemini (formato inlineData).
 */
export function attachmentToGeminiPart(
    attachment: Attachment
): GeminiInlineDataPart;

/**
 * Convierte bytes en Base64 de forma universal.
 */
export function bytesToBase64(bytes: Uint8Array): string;

export class MsgParser {
    constructor(arrayBuffer: ArrayBuffer | Uint8Array);
    getResult(): ParsedEmail;
}

export class EmlParser {
    constructor(rawInput: string | ArrayBuffer | Uint8Array);
    getResult(): ParsedEmail;
}

export class OLEReader {
    constructor(buffer: ArrayBuffer);
    readData(entry: any): Uint8Array;
}

export class RTFDecompressor {
    static decompress(data: Uint8Array): Uint8Array | null;
    static extractHtmlFromRtf(rtfBytes: Uint8Array): string | null;
}

export default parseEmail;
