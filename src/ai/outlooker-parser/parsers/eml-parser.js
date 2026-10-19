/**
 * EmlParser — Parser de archivos .EML (RFC 822 / MIME)
 * 
 * Soporta correos exportados desde Gmail, Thunderbird, Apple Mail, Outlook Web, etc.
 * Resuelve decodificación Base64, Quoted-Printable, estructuras multipart y adjuntos.
 */
export class EmlParser {
    /**
     * @param {string|ArrayBuffer|Uint8Array} rawInput - Texto o buffer del correo EML
     */
    constructor(rawInput) {
        if (rawInput instanceof ArrayBuffer || ArrayBuffer.isView(rawInput)) {
            const u8 = new Uint8Array(rawInput instanceof ArrayBuffer ? rawInput : rawInput.buffer, rawInput.byteOffset || 0, rawInput.byteLength || rawInput.length);
            const headerSnippet = new TextDecoder('utf-8', { fatal: false }).decode(u8.slice(0, 4096));
            const charsetMatch = headerSnippet.match(/charset\s*=\s*["']?([a-z0-9_\-]+)/i);
            const charset = charsetMatch ? charsetMatch[1].toLowerCase() : 'utf-8';
            try {
                this.raw = new TextDecoder(charset, { fatal: false }).decode(u8);
            } catch {
                this.raw = new TextDecoder('utf-8', { fatal: false }).decode(u8);
            }
        } else {
            this.raw = String(rawInput);
        }

        this.headers = {};
        this.body = '';
        this.bodyHtml = '';
        this.attachments = [];

        this._parse();
    }

    _parse() {
        const text = this.raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const sepIdx = text.indexOf('\n\n');
        const headerRaw = sepIdx >= 0 ? text.slice(0, sepIdx) : text;
        const bodyRaw   = sepIdx >= 0 ? text.slice(sepIdx + 2) : '';

        this.headers = this._parseHeaders(headerRaw);

        const ct = this.headers['content-type'] || 'text/plain';
        this._processPart(ct, this.headers, bodyRaw);
    }

    _parseHeaders(raw) {
        const headers = {};
        const unfolded = raw.replace(/\n[ \t]+/g, ' ');
        for (const line of unfolded.split('\n')) {
            const colon = line.indexOf(':');
            if (colon < 0) continue;
            const key = line.slice(0, colon).trim().toLowerCase();
            const val = line.slice(colon + 1).trim();
            if (key in headers) {
                if (!Array.isArray(headers[key])) headers[key] = [headers[key]];
                headers[key].push(val);
            } else {
                headers[key] = val;
            }
        }
        return headers;
    }

    _processPart(contentType, headers, body) {
        const { type, params } = this._parseContentType(contentType);
        const encoding = (headers['content-transfer-encoding'] || '').toLowerCase().trim();
        const disposition = headers['content-disposition'] || '';
        const isAttachment = /attachment/i.test(disposition) || /attachment/i.test(contentType);

        if (type.startsWith('multipart/')) {
            const boundary = params.boundary;
            if (boundary) {
                this._parseMultipart(body, boundary, type);
            }
            return;
        }

        let decoded = body;
        if (encoding === 'base64') {
            decoded = this._decodeBase64Part(body, type);
        } else if (encoding === 'quoted-printable') {
            decoded = this._decodeQP(body);
        }

        if (isAttachment) {
            const name = this._extractFilename(headers['content-disposition'] || '', contentType)
                      || params.name
                      || 'adjunto';
            const mimeType = type;
            if (encoding === 'base64') {
                try {
                    const b64 = body.replace(/\s/g, '');
                    const bin = atob(b64);
                    const bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                    this.attachments.push({ name, mimeType, size: bytes.length, data: bytes });
                } catch { /* ignorar adjunto malformado */ }
            } else {
                const enc = new TextEncoder();
                const bytes = enc.encode(decoded);
                this.attachments.push({ name, mimeType, size: bytes.length, data: bytes });
            }
            return;
        }

        if (type === 'text/html' && !this.bodyHtml) {
            this.bodyHtml = typeof decoded === 'string' ? decoded : new TextDecoder('utf-8', { fatal: false }).decode(decoded);
        } else if (type === 'text/plain' && !this.body) {
            this.body = typeof decoded === 'string' ? decoded : new TextDecoder('utf-8', { fatal: false }).decode(decoded);
        }
    }

    _parseMultipart(body, boundary, parentType) {
        const parts = body.split(new RegExp('--' + this._escapeBoundary(boundary) + '(?:--)?', 'g'));

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part.trim() === '' || part.trim() === '--') continue;

            const text = part.replace(/^\n/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const sepIdx = text.indexOf('\n\n');
            if (sepIdx < 0) continue;

            const partHeaderRaw = text.slice(0, sepIdx);
            const partBody = text.slice(sepIdx + 2);
            const cleanBody = partBody.endsWith('\n') ? partBody.slice(0, -1) : partBody;

            const partHeaders = this._parseHeaders(partHeaderRaw);
            const partCT = partHeaders['content-type'] || 'text/plain';

            this._processPart(partCT, partHeaders, cleanBody);
        }
    }

    _escapeBoundary(b) {
        return b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    _parseContentType(ct) {
        const parts = ct.split(';');
        const type = parts[0].trim().toLowerCase();
        const params = {};
        for (let i = 1; i < parts.length; i++) {
            const kv = parts[i].trim();
            const eq = kv.indexOf('=');
            if (eq < 0) continue;
            const k = kv.slice(0, eq).trim().toLowerCase();
            let v = kv.slice(eq + 1).trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            params[k] = v;
        }
        return { type, params };
    }

    _decodeQP(text) {
        return text
            .replace(/=\r?\n/g, '')
            .replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    }

    _decodeBase64Part(body, mimeType) {
        try {
            const b64 = body.replace(/\s/g, '');
            const bin = atob(b64);
            if (mimeType.startsWith('text/')) {
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
            }
            return bin;
        } catch {
            return body;
        }
    }

    _extractFilename(disposition, contentType) {
        let m = disposition.match(/filename\*\s*=\s*(?:[a-z0-9_\-]*'[^']*')?(.+)/i);
        if (m) return decodeURIComponent(m[1].trim().replace(/^"(.*)"$/, '$1'));
        m = disposition.match(/filename\s*=\s*"?([^";\r\n]+)"?/i);
        if (m) return m[1].trim();
        m = contentType.match(/name\s*=\s*"?([^";\r\n]+)"?/i);
        if (m) return m[1].trim();
        return null;
    }

    static decodeEncodedWords(str) {
        if (!str) return str;
        return str.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, text) => {
            try {
                let bytes;
                if (enc.toUpperCase() === 'B') {
                    const bin = atob(text);
                    bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                } else {
                    const qDecoded = text.replace(/_/g, ' ').replace(/=([0-9A-Fa-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
                    bytes = new TextEncoder().encode(qDecoded);
                }
                return new TextDecoder(charset, { fatal: false }).decode(bytes);
            } catch {
                return text;
            }
        });
    }

    /**
     * Retorna el objeto estandarizado ParsedEmail
     */
    getResult() {
        const dec = EmlParser.decodeEncodedWords;
        return {
            subject:      dec(this.headers['subject'])      || '(sin asunto)',
            from:         dec(this.headers['from'])         || '(desconocido)',
            to:           dec(this.headers['to'])           || '',
            cc:           dec(this.headers['cc'])           || '',
            bcc:          dec(this.headers['bcc'])          || '',
            body:         this.body,
            bodyHtml:     this.bodyHtml,
            headers:      Object.entries(this.headers)
                              .map(([k,v]) => `${k}: ${v}`)
                              .join('\n'),
            dateSent:     this.headers['date'] ? new Date(this.headers['date']) : null,
            dateReceived: null,
            attachments:  this.attachments,
        };
    }
}
