import React, { useState, useRef, useCallback } from 'react';
import { parseEmail, isEmailFile, attachmentToFile, type ParsedEmail, type Attachment } from '../ai/outlooker-parser';
import { EmailAttachmentPickerModal, type EmailPickerData } from '../ui/EmailAttachmentPickerModal';

export interface UseUniversalDropZoneOptions {
  targetZoneName: string;
  onFileAccepted: (file: File, emailContext?: ParsedEmail | null) => void | Promise<void>;
  acceptedExtensions?: string[];
  disabled?: boolean;
}

export function useUniversalDropZone({
  targetZoneName,
  onFileAccepted,
  acceptedExtensions,
  disabled = false
}: UseUniversalDropZoneOptions) {
  const [dragActive, setDragActive] = useState(false);
  const [pickerData, setPickerData] = useState<EmailPickerData | null>(null);
  const dragCounterRef = useRef(0);

  const filterRelevantAttachments = (attachments: Attachment[]): Attachment[] => {
    if (!attachments || attachments.length === 0) return [];
    if (attachments.length === 1) return attachments;

    const docs = attachments.filter((a) => {
      const ext = a.name.split('.').pop()?.toLowerCase() || '';
      const isDoc = ['pdf', 'xlsx', 'xls', 'csv', 'docx', 'doc', 'txt'].includes(ext);
      const isSmallImage = ['png', 'jpg', 'jpeg', 'gif'].includes(ext) && (a.size || 0) < 12000;
      return isDoc || !isSmallImage;
    });

    return docs.length > 0 ? docs : attachments;
  };

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      if (!dragActive) setDragActive(true);
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    },
    [disabled, dragActive]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setDragActive(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setDragActive(false);

      if (disabled) return;

      const dt = e.dataTransfer;
      if (!dt) return;

      const collectedFiles: File[] = [];

      if (dt.items && dt.items.length > 0) {
        for (let i = 0; i < dt.items.length; i++) {
          const item = dt.items[i];
          if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file) collectedFiles.push(file);
          }
        }
      }

      if (collectedFiles.length === 0 && dt.files && dt.files.length > 0) {
        for (let i = 0; i < dt.files.length; i++) {
          collectedFiles.push(dt.files[i]);
        }
      }

      if (collectedFiles.length === 0) {
        return;
      }

      // Check for Outlook .msg or MIME .eml
      const emailFile = collectedFiles.find(isEmailFile);

      if (emailFile) {
        try {
          const parsedEmail = await parseEmail(emailFile);
          const relevantAttachments = filterRelevantAttachments(parsedEmail.attachments || []);

          if (relevantAttachments.length === 1) {
            const singleAtt = attachmentToFile(relevantAttachments[0]);
            onFileAccepted(singleAtt, parsedEmail);
            return;
          }

          if (relevantAttachments.length > 1) {
            setPickerData({
              email: parsedEmail,
              originalFile: emailFile,
              targetZoneName,
              onSelectAttachment: (attFile, emailCtx) => {
                setPickerData(null);
                onFileAccepted(attFile, emailCtx);
              },
              onSelectEmailBody: (bodyFile, emailCtx) => {
                setPickerData(null);
                onFileAccepted(bodyFile, emailCtx);
              },
              onCancel: () => setPickerData(null)
            });
            return;
          }

          // Email without attachments: use body text
          const bodyFile = new File(
            [parsedEmail.body || ''],
            `${emailFile.name.replace(/\.[^/.]+$/, '')}.txt`,
            { type: 'text/plain' }
          );
          onFileAccepted(bodyFile, parsedEmail);
          return;
        } catch (err: any) {
          console.error('Error parsing Outlook email:', err);
          onFileAccepted(emailFile, null);
          return;
        }
      }

      // Normal file (PDF, etc.)
      let targetFile = collectedFiles[0];
      if (acceptedExtensions && acceptedExtensions.length > 0) {
        const extMatch = collectedFiles.find((f) => {
          const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '');
          return acceptedExtensions.includes(ext);
        });
        if (extMatch) {
          targetFile = extMatch;
        }
      }

      if (targetFile) {
        onFileAccepted(targetFile, null);
      }
    },
    [disabled, onFileAccepted, targetZoneName, acceptedExtensions]
  );

  return {
    dragActive,
    dropZoneProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    },
    EmailPickerModal: pickerData ? <EmailAttachmentPickerModal data={pickerData} /> : null
  };
}
