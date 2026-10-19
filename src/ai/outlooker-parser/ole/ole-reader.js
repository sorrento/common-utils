import { ENDOFCHAIN, FREESECT, NOSTREAM, OLE_SIGNATURE } from './ole-constants.js';

/**
 * OLEReader — Lector de archivos OLE Compound Binary (CFB / MS-CFB)
 * 
 * Permite navegar la estructura de sectores FAT, DIFAT, MiniFAT y directorios
 * jerárquicos de archivos binarios compuestos de Microsoft (.msg, .doc, .xls clásicos).
 */
export class OLEReader {
    constructor(buffer) {
        this.buf = buffer;
        this.view = new DataView(buffer);
        this.u8 = new Uint8Array(buffer);

        this._parseHeader();
        this._buildFAT();
        this._parseDirectoryEntries();
        this._assignPaths();
        this._prepareMiniFAT();
    }

    _parseHeader() {
        for (let i = 0; i < 8; i++) {
            if (this.u8[i] !== OLE_SIGNATURE[i]) {
                throw new Error('No es un archivo OLE/MSG válido (firma mágica no coincide)');
            }
        }

        this.secSizePow     = this.view.getUint16(30, true);
        this.secSize        = 1 << this.secSizePow;           // Normalmente 512 bytes
        this.miniSecSizePow = this.view.getUint16(32, true);
        this.miniSecSize    = 1 << this.miniSecSizePow;       // Normalmente 64 bytes

        this.totalFATSectors = this.view.getUint32(44, true);
        this.firstDirSector  = this.view.getUint32(48, true);
        this.miniCutoffSize  = this.view.getUint32(56, true); // 4096 bytes
        this.firstMiniFATSec = this.view.getUint32(60, true);
        this.totalMiniFATSec = this.view.getUint32(64, true);
        this.firstDIFATSec   = this.view.getUint32(68, true);
        this.totalDIFATSec   = this.view.getUint32(72, true);

        // DIFAT — Primeras 109 entradas en el header (offset 76)
        this.difat = [];
        for (let i = 0; i < 109; i++) {
            const v = this.view.getUint32(76 + i * 4, true);
            this.difat.push(v);
        }

        // DIFAT adicional si hay más de 109 sectores FAT
        if (this.totalDIFATSec > 0 && this.firstDIFATSec !== ENDOFCHAIN) {
            let sec = this.firstDIFATSec;
            for (let d = 0; d < this.totalDIFATSec; d++) {
                const off = this._secOff(sec);
                const perSec = (this.secSize / 4) - 1;
                for (let i = 0; i < perSec; i++) {
                    this.difat.push(this.view.getUint32(off + i * 4, true));
                }
                sec = this.view.getUint32(off + perSec * 4, true);
                if (sec === ENDOFCHAIN || sec === FREESECT) break;
            }
        }
    }

    _secOff(sec) {
        return (sec + 1) * this.secSize;
    }

    _buildFAT() {
        this.fat = [];
        for (const sec of this.difat) {
            if (sec === FREESECT || sec === ENDOFCHAIN) continue;
            const off = this._secOff(sec);
            const cnt = this.secSize / 4;
            for (let i = 0; i < cnt; i++) {
                this.fat.push(this.view.getUint32(off + i * 4, true));
            }
        }
    }

    _chain(start) {
        const c = [];
        let cur = start;
        const limit = this.fat.length + 1;
        let n = 0;
        while (cur !== ENDOFCHAIN && cur !== FREESECT && n < limit) {
            c.push(cur);
            cur = this.fat[cur];
            n++;
        }
        return c;
    }

    _readChain(start, size) {
        const chain = this._chain(start);
        const out = new Uint8Array(size);
        let pos = 0;
        for (const sec of chain) {
            const off = this._secOff(sec);
            const n = Math.min(this.secSize, size - pos);
            const avail = Math.min(n, this.buf.byteLength - off);
            if (avail > 0) out.set(new Uint8Array(this.buf, off, avail), pos);
            pos += n;
            if (pos >= size) break;
        }
        return out;
    }

    _parseDirectoryEntries() {
        const chain = this._chain(this.firstDirSector);
        this.entries = [];
        const perSec = this.secSize / 128;

        for (const sec of chain) {
            const base = this._secOff(sec);
            for (let i = 0; i < perSec; i++) {
                const off = base + i * 128;
                if (off + 128 > this.buf.byteLength) {
                    this.entries.push(null);
                    continue;
                }

                const nameBytes = this.view.getUint16(off + 64, true);
                if (nameBytes === 0) {
                    this.entries.push(null);
                    continue;
                }

                let name = '';
                const chars = (nameBytes - 2) / 2;
                for (let c = 0; c < chars; c++) {
                    name += String.fromCharCode(this.view.getUint16(off + c * 2, true));
                }

                this.entries.push({
                    name,
                    type:     this.u8[off + 66],
                    leftSIB:  this.view.getUint32(off + 68, true),
                    rightSIB: this.view.getUint32(off + 72, true),
                    childSID: this.view.getUint32(off + 76, true),
                    startSec: this.view.getUint32(off + 116, true),
                    size:     this.view.getUint32(off + 120, true),
                    path:     '',
                    idx:      this.entries.length,
                });
            }
        }
    }

    _assignPaths() {
        const root = this.entries[0];
        if (!root) return;
        root.path = root.name;
        if (root.childSID !== NOSTREAM) {
            this._walk(root.childSID, root.path, new Set());
        }
    }

    _walk(idx, parentPath, visited) {
        if (idx === NOSTREAM || idx >= this.entries.length || visited.has(idx)) return;
        visited.add(idx);
        const e = this.entries[idx];
        if (!e) return;
        e.path = parentPath + '/' + e.name;
        if (e.leftSIB  !== NOSTREAM) this._walk(e.leftSIB,  parentPath, visited);
        if (e.rightSIB !== NOSTREAM) this._walk(e.rightSIB, parentPath, visited);
        if (e.childSID !== NOSTREAM) this._walk(e.childSID, e.path, visited);
    }

    _prepareMiniFAT() {
        this.miniFat = [];
        this.miniStream = null;

        if (this.firstMiniFATSec === ENDOFCHAIN || this.totalMiniFATSec === 0) return;

        for (const sec of this._chain(this.firstMiniFATSec)) {
            const off = this._secOff(sec);
            const cnt = this.secSize / 4;
            for (let i = 0; i < cnt; i++) {
                this.miniFat.push(this.view.getUint32(off + i * 4, true));
            }
        }

        const root = this.entries[0];
        if (root && root.startSec !== ENDOFCHAIN && root.size > 0) {
            this.miniStream = this._readChain(root.startSec, root.size);
        }
    }

    _readMini(start, size) {
        if (!this.miniStream) return new Uint8Array(0);
        const out = new Uint8Array(size);
        let cur = start, pos = 0, n = 0;
        const limit = this.miniFat.length + 1;
        while (cur !== ENDOFCHAIN && cur !== FREESECT && pos < size && n < limit) {
            const off = cur * this.miniSecSize;
            const copy = Math.min(this.miniSecSize, size - pos);
            if (off + copy <= this.miniStream.length) {
                out.set(this.miniStream.slice(off, off + copy), pos);
            }
            pos += copy;
            cur = this.miniFat[cur];
            n++;
        }
        return out;
    }

    /**
     * Lee los datos binarios de una entrada de stream OLE.
     * Si la entrada es pequeña (< 4096 bytes), se lee desde el MiniStream/MiniFAT.
     */
    readData(entry) {
        if (!entry || entry.size === 0) return new Uint8Array(0);
        if (entry.type === 2 && entry.size < this.miniCutoffSize && this.miniStream) {
            return this._readMini(entry.startSec, entry.size);
        }
        return this._readChain(entry.startSec, entry.size);
    }
}
