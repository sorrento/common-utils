/**
 * Constantes de especificación OLE Compound File Binary (MS-CFB)
 */
export const ENDOFCHAIN = 0xFFFFFFFE;
export const FREESECT   = 0xFFFFFFFF;
export const NOSTREAM   = 0xFFFFFFFF;

// Signatura estándar de archivos OLE / CFB / MSG (8 bytes mágicos: D0 CF 11 E0 A1 B1 1A E1)
export const OLE_SIGNATURE = [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1];
