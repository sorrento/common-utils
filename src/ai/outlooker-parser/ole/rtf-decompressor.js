/**
 * RTFDecompressor — Descompresor LZFu de Microsoft (MS-OXRTFCP)
 * y extractor de HTML encapsulado en RTF (MS-OXRTFEX)
 * 
 * En correos de Microsoft Outlook (.msg), el cuerpo enriquecido frecuentemente
 * se guarda como RTF comprimido con LZFu (`PidTagRtfCompressed` / `0x1009`).
 * Este módulo descomprime ese flujo binario y extrae el HTML embebido
 * bajo la directiva `\fromhtml` y etiquetas `{\*\htmltag...}`.
 */
export class RTFDecompressor {
    static INIT_DICT = 
        "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\" +
        "fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New " +
        "RomanCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\" +
        "f0\\fs20\\b\\i\\u\\tab\\tx";

    /**
     * Descomprime un buffer de RTF comprimido de Microsoft Outlook.
     * @param {Uint8Array} data - Flujo binario de la propiedad 1009 (rtfCompressed).
     * @returns {Uint8Array|null} Datos RTF descomprimidos o null si no es válido.
     */
    static decompress(data) {
        if (!data || data.length < 16) return null;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const compSize = view.getUint32(0, true);
        const rawSize  = view.getUint32(4, true);
        const compType = [data[8], data[9], data[10], data[11]];
        
        // Comprobar magic: 'LZFu' (0x4c, 0x5a, 0x46, 0x75)
        const isCompressed = compType[0] === 0x4c && compType[1] === 0x5a && compType[2] === 0x46 && compType[3] === 0x75;
        // 'MELA' o 'MEJA' = sin compresión
        const isUncompressed = compType[0] === 0x4d && compType[1] === 0x45;

        if (isUncompressed) {
            return data.slice(16, 16 + rawSize);
        }

        if (!isCompressed) {
            return null;
        }

        const out = new Uint8Array(rawSize);
        let outPos = 0;

        // Inicializar diccionario circular de 4096 bytes con espacios y el prefijo de Microsoft
        const dict = new Uint8Array(4096);
        for (let i = 0; i < 4096; i++) dict[i] = 0x20;
        for (let i = 0; i < RTFDecompressor.INIT_DICT.length; i++) {
            dict[i] = RTFDecompressor.INIT_DICT.charCodeAt(i);
        }

        let writeOffset = 207;
        let pos = 16;
        const endPos = Math.min(data.length, compSize + 4);

        while (pos < endPos && outPos < rawSize) {
            const control = data[pos++];
            // 8 bits de control de LSB a MSB
            for (let bit = 0; bit < 8; bit++) {
                if (pos >= endPos || outPos >= rawSize) break;
                const isRef = (control & (1 << bit)) !== 0;

                if (isRef) {
                    if (pos + 1 >= endPos) break;
                    const b1 = data[pos++];
                    const b2 = data[pos++];
                    const token = (b1 << 8) | b2;
                    const offset = (token >> 4) & 0xFFF;
                    const length = token & 0xF;

                    if (writeOffset === offset) {
                        pos = endPos;
                        break;
                    }

                    const actualLength = length + 2;
                    for (let step = 0; step < actualLength; step++) {
                        const readOffset = (offset + step) % 4096;
                        const ch = dict[readOffset];
                        if (outPos < rawSize) out[outPos++] = ch;
                        dict[writeOffset] = ch;
                        writeOffset = (writeOffset + 1) % 4096;
                    }
                } else {
                    const ch = data[pos++];
                    if (outPos < rawSize) out[outPos++] = ch;
                    dict[writeOffset] = ch;
                    writeOffset = (writeOffset + 1) % 4096;
                }
            }
        }

        return outPos === rawSize ? out : out.slice(0, outPos);
    }

    /**
     * Extrae el código HTML puro encapsulado dentro de un documento RTF (MS-OXRTFEX).
     * @param {Uint8Array} rtfBytes - Bytes de texto RTF descomprimido.
     * @returns {string|null} Cadena HTML extraída o null si no encapsula HTML.
     */
    static extractHtmlFromRtf(rtfBytes) {
        if (!rtfBytes || rtfBytes.length === 0) return null;
        
        let rtfStr = '';
        for (let i = 0; i < rtfBytes.length; i++) {
            rtfStr += String.fromCharCode(rtfBytes[i]);
        }

        if (!rtfStr.includes('\\fromhtml')) {
            return null;
        }

        // Detectar codepage (ej. \ansicpg1252 o \ansicpg65001)
        let codePage = 'windows-1252';
        const cpMatch = rtfStr.match(/\\ansicpg(\d+)/);
        if (cpMatch) {
            const cpNum = cpMatch[1];
            if (cpNum === '65001') codePage = 'utf-8';
            else codePage = 'windows-' + cpNum;
        }

        let decoder;
        try {
            decoder = new TextDecoder(codePage, { fatal: false });
        } catch {
            decoder = new TextDecoder('windows-1252', { fatal: false });
        }

        const HTMLTAG_PREFIX = '{\\*\\htmltag';
        const len = rtfStr.length;
        let pos = rtfStr.indexOf(HTMLTAG_PREFIX);
        if (pos < 0) return null;

        let result = '';
        let pendingBytes = [];
        let inHtmlRtfSkip = false;

        function flushBytes() {
            if (pendingBytes.length > 0) {
                try {
                    result += decoder.decode(new Uint8Array(pendingBytes));
                } catch {
                    for (const b of pendingBytes) result += String.fromCharCode(b);
                }
                pendingBytes = [];
            }
        }

        while (pos < len) {
            // Caso 1: Etiqueta HTML encapsulada {\*\htmltagN <html>}
            if (rtfStr.startsWith(HTMLTAG_PREFIX, pos)) {
                flushBytes();
                const groupEnd = RTFDecompressor._findMatchingBrace(rtfStr, pos);
                if (groupEnd < 0) break;

                let contentStart = pos + HTMLTAG_PREFIX.length;
                while (contentStart < groupEnd && rtfStr.charCodeAt(contentStart) >= 48 && rtfStr.charCodeAt(contentStart) <= 57) {
                    contentStart++;
                }
                if (contentStart < groupEnd && rtfStr[contentStart] === ' ') {
                    contentStart++;
                }

                const inner = rtfStr.substring(contentStart, groupEnd);
                result += RTFDecompressor._decodeHtmlTagContent(inner, decoder);
                pos = groupEnd + 1;
                continue;
            }

            // Caso 2: \htmlrtf y \htmlrtf0 (texto visible solo en visores RTF)
            if (rtfStr.startsWith('\\htmlrtf', pos)) {
                flushBytes();
                let after = pos + 8;
                if (after < len && rtfStr[after] === '0') {
                    inHtmlRtfSkip = false;
                    after++;
                    if (after < len && rtfStr[after] === ' ') after++;
                } else {
                    inHtmlRtfSkip = true;
                    if (after < len && rtfStr[after] === ' ') after++;
                }
                pos = after;
                continue;
            }

            if (inHtmlRtfSkip) {
                pos++;
                continue;
            }

            const c = rtfStr[pos];

            if (c === '\\') {
                if (pos + 1 >= len) break;
                const next = rtfStr[pos + 1];

                // Escape de byte hexadecimal \'hh
                if (next === '\'' && pos + 3 < len) {
                    const hex = rtfStr.substring(pos + 2, pos + 4);
                    const b = parseInt(hex, 16);
                    if (!isNaN(b)) pendingBytes.push(b);
                    pos += 4;
                    continue;
                }

                flushBytes();

                // Caracteres escapados: \\, \{, \}
                if (next === '\\' || next === '{' || next === '}') {
                    result += next;
                    pos += 2;
                    continue;
                }

                // Palabras de control RTF
                if ((next >= 'a' && next <= 'z') || (next >= 'A' && next <= 'Z')) {
                    let wEnd = pos + 1;
                    while (wEnd < len && ((rtfStr[wEnd] >= 'a' && rtfStr[wEnd] <= 'z') || (rtfStr[wEnd] >= 'A' && rtfStr[wEnd] <= 'Z'))) {
                        wEnd++;
                    }
                    const word = rtfStr.substring(pos + 1, wEnd);
                    let pEnd = wEnd;
                    if (pEnd < len && (rtfStr[pEnd] === '-' || (rtfStr[pEnd] >= '0' && rtfStr[pEnd] <= '9'))) {
                        pEnd++;
                        while (pEnd < len && (rtfStr[pEnd] >= '0' && rtfStr[pEnd] <= '9')) pEnd++;
                    }
                    if (pEnd < len && rtfStr[pEnd] === ' ') pEnd++;

                    if (word === 'par' || word === 'pard') result += '\n';
                    else if (word === 'tab') result += '\t';
                    else if (word === 'line') result += '<br>';

                    pos = pEnd;
                    continue;
                }

                pos++;
                continue;
            }

            if (c === '{' || c === '}') {
                flushBytes();
                pos++;
                continue;
            }

            if (c === '\r' || c === '\n') {
                flushBytes();
                pos++;
                continue;
            }

            pendingBytes.push(rtfStr.charCodeAt(pos));
            pos++;
        }

        flushBytes();
        return result.trim().length > 0 ? result : null;
    }

    static _findMatchingBrace(str, openPos) {
        let depth = 0;
        const len = str.length;
        for (let i = openPos; i < len; i++) {
            const c = str[i];
            if (c === '\\' && i + 1 < len) {
                const next = str[i + 1];
                if (next === '{' || next === '}' || next === '\\') {
                    i++;
                    continue;
                }
            }
            if (c === '{') depth++;
            else if (c === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }
        return -1;
    }

    static _decodeHtmlTagContent(content, decoder) {
        let out = '';
        const len = content.length;
        let i = 0;
        let pending = [];

        function flush() {
            if (pending.length > 0) {
                try {
                    out += decoder.decode(new Uint8Array(pending));
                } catch {
                    for (const b of pending) out += String.fromCharCode(b);
                }
                pending = [];
            }
        }

        while (i < len) {
            const c = content[i];
            if (c === '\\') {
                if (i + 1 >= len) break;
                const next = content[i + 1];
                if (next === '\'' && i + 3 < len) {
                    const hex = content.substring(i + 2, i + 4);
                    const b = parseInt(hex, 16);
                    if (!isNaN(b)) pending.push(b);
                    i += 4;
                    continue;
                }

                flush();

                if (next === '\\' || next === '{' || next === '}') {
                    out += next;
                    i += 2;
                    continue;
                }

                if ((next >= 'a' && next <= 'z') || (next >= 'A' && next <= 'Z')) {
                    let wEnd = i + 1;
                    while (wEnd < len && ((content[wEnd] >= 'a' && content[wEnd] <= 'z') || (content[wEnd] >= 'A' && content[wEnd] <= 'Z'))) {
                        wEnd++;
                    }
                    const word = content.substring(i + 1, wEnd);
                    let pEnd = wEnd;
                    if (pEnd < len && (content[pEnd] === '-' || (content[pEnd] >= '0' && content[pEnd] <= '9'))) {
                        pEnd++;
                        while (pEnd < len && (content[pEnd] >= '0' && content[pEnd] <= '9')) pEnd++;
                    }
                    if (pEnd < len && content[pEnd] === ' ') pEnd++;

                    if (word === 'par' || word === 'pard') out += '\n';
                    else if (word === 'tab') out += '\t';
                    else if (word === 'line') out += '<br>';
                    else if (word === 'htmlrtf') {
                        const skipEnd = content.indexOf('\\htmlrtf0', i);
                        if (skipEnd >= 0) {
                            i = skipEnd + 9;
                            if (i < len && content[i] === ' ') i++;
                            continue;
                        }
                    }

                    i = pEnd;
                    continue;
                }

                i++;
                continue;
            }

            if (c === '{' || c === '}') {
                flush();
                i++;
                continue;
            }

            pending.push(content.charCodeAt(i));
            i++;
        }
        flush();
        return out;
    }
}
