import React from 'react';
import { useCorporateAuth } from '../context/CorporateAuthContext';
import { CorporateLoginView } from './CorporateLoginView';
import { CorporatePendingApprovalView } from './CorporatePendingApprovalView';

export interface CorporateAuthGateProps {
  children: React.ReactNode;
  fallbackLoading?: React.ReactNode;
}

export const CorporateAuthGate: React.FC<CorporateAuthGateProps> = ({
  children,
  fallbackLoading
}) => {
  const { currentUser, firebaseUser, loading, tenantConfig } = useCorporateAuth();
  const isDark = tenantConfig.theme === 'dark';

  if (loading) {
    if (fallbackLoading) return <>{fallbackLoading}</>;

    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? '#0a101d' : 'var(--bg, #f7faf9)',
        color: isDark ? '#f8fafc' : 'var(--ink, #10201d)',
        fontFamily: 'var(--font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid #dbe6e3',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 4px 16px rgba(16, 32, 29, 0.08)',
            overflow: 'hidden'
          }}>
            <img
              src="/aida-logo.jpg"
              alt={tenantConfig.appName}
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain'
              }}
            />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#ffffff' : 'var(--ink, #10201d)', marginBottom: '6px' }}>
            Cargando {tenantConfig.appName}...
          </div>
          <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : 'var(--muted, #60706c)' }}>
            Verificando credenciales corporativas y acceso a lista blanca
          </div>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <CorporateLoginView />;
  }

  if (!currentUser || currentUser.status !== 'approved') {
    return <CorporatePendingApprovalView />;
  }

  return <>{children}</>;
};
