import { OLEReader } from '../ole/ole-reader.js';
import { RTFDecompressor } from '../ole/rtf-decompressor.js';
import { MSG_PROPERTIES, ATTACHMENT_PROPERTIES } from '../ole/mapi-tags.js';

/**
 * MsgParser — Extractor de propiedades de correos .MSG de Microsoft Outlook
 * 
 * Lee el archivo estructurado OLE, extrae los streams MAPI correspondientes
 * a metadatos, remitentes, destinatarios, cuerpo (texto/HTML/RTF) y adjuntos.
 */
export class MsgParser {
    static MSG_PROPS = MSG_PROPERTIES;
    static ATT_PROPS = ATTACHMENT_PROPERTIES;

    /**
     * @param {ArrayBuffer|Uint8Array} arrayBuffer - Buffer binario del archivo .msg
     */
    constructor(arrayBuffer) {
        const buffer = arrayBuffer instanceof Uint8Array 
            ? arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength)
            : arrayBuffer;

        this.ole = new OLEReader(buffer);
        this.props = {};
        this.dates = {};
        this.attachments = [];

        this._readMsgProperties();
        this._readDates();
        this._readAttachments();
    }

    _readMsgProperties() {
        const rootPath = this.ole.entries[0]?.path || 'Root Entry';

        for (const entry of this.ole.entries) {
            if (!entry?.path) continue;
            if (!entry.path.startsWith(rootPath + '/__substg1.0_')) continue;
            if (entry.path.includes('__attach_') || entry.path.includes('__recip_')) continue;

            const m = entry.name.match(/^__substg1\.0_([0-9A-Fa-f]{4})([0-9A-Fa-f]{4})$/);
            if (!m) continue;

            const propId   = m[1].toUpperCase();
            const propType = m[2].toUpperCase();
            const propName = MsgParser.MSG_PROPS[propId];
            if (!propName) continue;

            // Si ya leímos la versión Unicode (001F), ignorar la versión ANSI (001E)
            if (this.props[propName] && propType === '001E') continue;

            try {
                const data = this.ole.readData(entry);
                if (data.length === 0) continue;

                if (propType === '001F') {
                    this.props[propName] = this._utf16le(data);
                } else if (propType === '001E') {
                    this.props[propName] = this._ansi(data);
                } else if (propType === '0102') {
                    if (propId === '1013') {
                        this.props.bodyHtml = this._binaryText(data);
                    } else if (propId === '1009') {
                        this.props.rtfCompressed = data;
                    }
                }
            } catch (e) {
                console.warn(`MSG: Error leyendo propiedad ${propId}:`, e);
            }
        }
    }

    _readDates() {
        const rootPath = this.ole.entries[0]?.path || 'Root Entry';
        const pe = this.ole.entries.find(e =>
            e?.path === rootPath + '/__properties_version1.0'
        );
        if (!pe || pe.size === 0) return;

        try {
            const data = this.ole.readData(pe);
            const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

            for (let off = 32; off + 16 <= data.length; off += 16) {
                const pType = dv.getUint16(off, true);
                const pId   = dv.getUint16(off + 2, true);

                // Tipo 0x0040 = PT_SYSTIME (FILETIME de Windows)
                if (pType === 0x0040) {
                    const lo = dv.getUint32(off + 8, true);
                    const hi = dv.getUint32(off + 12, true);
                    const ft = hi * 0x100000000 + lo;
                    // Conversión de Windows FILETIME (intervalos de 100ns desde 1601) a Unix ms (desde 1970)
                    const ms = ft / 10000 - 11644473600000;
                    const d  = new Date(ms);
                    if (isNaN(d.getTime())) continue;

                    if (pId === 0x0039) this.dates.sent     = d;
                    if (pId === 0x0E06) this.dates.received  = d;
                    if (pId === 0x3007) this.dates.created   = d;
                    if (pId === 0x3008) this.dates.modified  = d;
                }
            }
        } catch (e) {
            console.warn('MSG: Error leyendo fechas del mensaje:', e);
        }
    }

    _readAttachments() {
        const rootPath = this.ole.entries[0]?.path || 'Root Entry';
        const storages = this.ole.entries.filter(e =>
            e && e.type === 1 && e.name && e.name.startsWith('__attach_version1.0_#')
        );

        for (const storage of storages) {
            const att = {};

            for (const entry of this.ole.entries) {
                if (!entry?.path || !entry.path.startsWith(storage.path + '/__substg1.0_')) continue;

                const m = entry.name.match(/^__substg1\.0_([0-9A-Fa-f]{4})([0-9A-Fa-f]{4})$/);
                if (!m) continue;

                const propId   = m[1].toUpperCase();
                const propType = m[2].toUpperCase();
                const propName = MsgParser.ATT_PROPS[propId];
                if (!propName) continue;

                try {
                    const data = this.ole.readData(entry);
                    if (data.length === 0) continue;
                    if (propType === '001F') att[propName] = this._utf16le(data);
                    else if (propType === '001E' && !att[propName]) att[propName] = this._ansi(data);
                } catch { /* ignorar propiedad ilegible */ }
            }

            // Stream de datos binarios del adjunto: __substg1.0_37010102
            const dataEntry = this.ole.entries.find(e =>
                e?.path?.startsWith(storage.path + '/') &&
                /^__substg1\.0_37010102$/i.test(e.name)
            );

            let contentBytes = null;
            if (dataEntry && dataEntry.size > 0) {
                try {
                    contentBytes = this.ole.readData(dataEntry);
                } catch (e) {
                    console.warn('Error leyendo datos binarios de adjunto:', e);
                }
            }

            const name = att.longName || att.shortName;
            if (name) {
                this.attachments.push({
                    name,
                    mimeType:  att.mimeTag  || 'application/octet-stream',
                    size:      dataEntry?.size || (contentBytes ? contentBytes.length : 0),
                    contentId: att.contentId || '',
                    data:      contentBytes,
                });
            }
        }
    }

    _utf16le(data) {
        let s = '';
        for (let i = 0; i < data.length - 1; i += 2) {
            const c = data[i] | (data[i + 1] << 8);
            if (c === 0) break;
            s += String.fromCharCode(c);
        }
        return s;
    }

    _ansi(data) {
        try { return new TextDecoder('windows-1252').decode(data); }
        catch { return new TextDecoder('utf-8', { fatal: false }).decode(data); }
    }

    _binaryText(data) {
        try { return new TextDecoder('utf-8', { fatal: true }).decode(data); }
        catch {
            try { return new TextDecoder('windows-1252').decode(data); }
            catch { return new TextDecoder('utf-8', { fatal: false }).decode(data); }
        }
    }

    /**
     * Retorna el objeto estandarizado ParsedEmail
     */
    getResult() {
        const fromName  = this.props.senderName  || this.props.sentRepName  || '';
        const fromEmail = this.props.senderSmtp   || this.props.senderSmtp2 || this.props.sentRepEmail || '';
        const from = fromEmail ? `${fromName} <${fromEmail}>` : fromName;

        let bodyHtml = this.props.bodyHtml || '';
        // Si no hay HTML explícito pero hay RTF comprimido, intentamos extraer el HTML encapsulado
        if (!bodyHtml && this.props.rtfCompressed) {
            try {
                const decompressed = RTFDecompressor.decompress(this.props.rtfCompressed);
                if (decompressed) {
                    const extracted = RTFDecompressor.extractHtmlFromRtf(decompressed);
                    if (extracted) {
                        bodyHtml = extracted;
                    }
                }
            } catch (rtfErr) {
                console.warn('MSG: Error extrayendo HTML de RTF comprimido:', rtfErr);
            }
        }

        return {
            subject:      this.props.subject      || '(sin asunto)',
            from:         from                     || '(desconocido)',
            to:           this.props.displayTo     || '',
            cc:           this.props.displayCc     || '',
            bcc:          this.props.displayBcc    || '',
            body:         this.props.body          || '',
            bodyHtml:     bodyHtml,
            headers:      this.props.headers       || '',
            dateSent:     this.dates.sent           || null,
            dateReceived: this.dates.received       || null,
            attachments:  this.attachments,
        };
    }
}
