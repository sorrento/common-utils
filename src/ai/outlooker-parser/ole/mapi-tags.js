/**
 * Mapeo de Identificadores MAPI canónicos de Microsoft Outlook (MS-OXPROPS)
 */

/**
 * Propiedades del mensaje a nivel raíz
 */
export const MSG_PROPERTIES = {
    '0037': 'subject',          // PidTagSubject
    '0C1A': 'senderName',       // PidTagSenderName
    '0C1F': 'senderSmtp',       // PidTagSenderSmtpAddress
    '0065': 'sentRepEmail',     // PidTagSentRepresentingEmailAddress
    '0042': 'sentRepName',      // PidTagSentRepresentingName
    '0076': 'receivedByEmail',  // PidTagReceivedByEmailAddress
    '0E04': 'displayTo',        // PidTagDisplayTo
    '0E03': 'displayCc',        // PidTagDisplayCc
    '0E02': 'displayBcc',       // PidTagDisplayBcc
    '1000': 'body',             // PidTagBody (texto plano)
    '1009': 'rtfCompressed',    // PidTagRtfCompressed
    '1013': 'bodyHtml',         // PidTagBodyHtml
    '007D': 'headers',          // PidTagTransportMessageHeaders
    '0070': 'topic',            // PidTagConversationTopic
    '0064': 'sentRepAddrType',  // PidTagSentRepresentingAddressType
    '5D01': 'senderSmtp2',      // PidTagSenderSmtpAddress (alternativo)
};

/**
 * Propiedades específicas de los adjuntos (__attach_version1.0_#...)
 */
export const ATTACHMENT_PROPERTIES = {
    '3704': 'shortName',        // PidTagAttachFilename
    '3707': 'longName',         // PidTagAttachLongFilename
    '370E': 'mimeTag',          // PidTagAttachMimeTag
    '3712': 'contentId',        // PidTagAttachContentId
};

/**
 * Tipos de datos MAPI (substg type)
 */
export const MAPI_TYPES = {
    STRING_ANSI:    '001E', // PT_STRING8
    STRING_UNICODE: '001F', // PT_UNICODE
    BINARY:         '0102', // PT_BINARY
    TIME:           '0040', // PT_SYSTIME
};
