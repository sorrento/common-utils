import React from 'react';
import type { Attachment, ParsedEmail } from '../ai/outlooker-parser';

export interface EmailPickerData {
  email: ParsedEmail;
  originalFile: File;
  targetZoneName: string;
  onSelectAttachment: (attachmentFile: File, emailContext: ParsedEmail) => void;
  onSelectEmailBody: (emailBodyFile: File, emailContext: ParsedEmail) => void;
  onCancel: () => void;
}

interface EmailAttachmentPickerModalProps {
  data: EmailPickerData | null;
}

export const EmailAttachmentPickerModal: React.FC<EmailAttachmentPickerModalProps> = ({ data }) => {
  if (!data) return null;

  const { email, targetZoneName, onSelectAttachment, onSelectEmailBody, onCancel } = data;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePickAttachment = (att: Attachment) => {
    const mime = att.mimeType || 'application/octet-stream';
    const file = new File([(att.data || new Uint8Array(0)) as any], att.name, { type: mime });
    onSelectAttachment(file, email);
  };

  const handlePickBody = () => {
    const subjectClean = (email.subject || 'email-content')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const content = [
      `Subject: ${email.subject || ''}`,
      `From: ${email.from || ''}`,
      `Date: ${email.dateSent ? new Date(email.dateSent).toISOString() : ''}`,
      '\n--- EMAIL BODY ---\n',
      email.body || ''
    ].join('\n');

    const bodyFile = new File([content], `${subjectClean}.txt`, { type: 'text/plain' });
    onSelectEmailBody(bodyFile, email);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00bfa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                Outlook Email Detected
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Target: <strong style={{ color: '#0d9488' }}>{targetZoneName}</strong>
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            &times;
          </button>
        </div>

        {/* Email Context Snippet */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f0fdfa',
            borderBottom: '1px solid #ccfbf1',
            fontSize: '12px'
          }}
        >
          <div style={{ fontWeight: 600, color: '#0f766e', marginBottom: '2px' }}>
            Subject: {email.subject || '(No subject)'}
          </div>
          <div style={{ color: '#115e59', fontSize: '11px' }}>
            From: {email.from || '(Unknown)'}
          </div>
        </div>

        {/* Attachment List */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '10px'
            }}
          >
            Select Attachment to Process ({email.attachments?.length || 0}):
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {email.attachments && email.attachments.length > 0 ? (
              email.attachments.map((att, idx) => {
                const isPdf = att.name.toLowerCase().endsWith('.pdf');
                return (
                  <div
                    key={idx}
                    onClick={() => handlePickAttachment(att)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#ffffff',
                      border: isPdf ? '1.5px solid #00bfa8' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                          {att.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {formatBytes(att.size || 0)} {isPdf ? '· PDF Document' : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: isPdf ? '#00bfa8' : '#f1f5f9',
                        color: isPdf ? '#ffffff' : '#334155',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Process File
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                No attachments found inside this email.
              </div>
            )}
          </div>

          {/* Option to use Email Body */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px dashed #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
                Process Email Body Text
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Extract disbursement or port information directly from the email text
              </div>
            </div>
            <button
              type="button"
              onClick={handlePickBody}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 500,
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Use Text
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              color: '#64748b',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
