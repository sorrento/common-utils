import React from 'react';
import { useCorporateAuth } from '../context/CorporateAuthContext';
import { ShieldAlert, LogOut, Lock } from 'lucide-react';

export const CorporatePendingApprovalView: React.FC = () => {
  const { currentUser, signOut, tenantConfig } = useCorporateAuth();
  const isDark = tenantConfig.theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#0a101d' : 'var(--bg, #f7faf9)',
      padding: '1.5rem',
      position: 'relative',
      fontFamily: 'var(--font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        backgroundColor: isDark ? '#0d1527' : '#ffffff',
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          : '0 20px 60px rgba(16, 32, 29, 0.08), 0 0 0 1px #dbe6e3',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 1,
        color: isDark ? '#f8fafc' : 'var(--ink, #10201d)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '68px',
          height: '68px',
          backgroundColor: 'rgba(223, 63, 69, 0.10)',
          border: '1px solid rgba(223, 63, 69, 0.25)',
          color: '#df3f45',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <ShieldAlert size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: isDark ? '#ffffff' : 'var(--ink, #10201d)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Acceso Corporativo No Autorizado
        </h2>

        <p style={{ fontSize: '0.925rem', color: isDark ? '#94a3b8' : 'var(--muted, #60706c)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          La cuenta autenticada <strong style={{ color: isDark ? '#ffffff' : 'var(--ink, #10201d)' }}>{currentUser?.email}</strong> no figura en la lista blanca de usuarios autorizados de <strong>{tenantConfig.appName} ({tenantConfig.companyName})</strong>.
        </p>

        <div style={{
          backgroundColor: isDark ? 'rgba(223, 63, 69, 0.1)' : 'rgba(223, 63, 69, 0.05)',
          border: '1px solid rgba(223, 63, 69, 0.2)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 800, color: '#df3f45', marginBottom: '0.5rem' }}>
            <Lock size={16} /> Política de Seguridad y Whitelist
          </div>
          <p style={{ fontSize: '0.825rem', color: isDark ? '#fca5a5' : '#8a2b2e', margin: 0, lineHeight: 1.5 }}>
            Se ha enviado una notificación automática por correo al Administrador (<strong>{tenantConfig.adminEmail}</strong>). Si requieres acceso corporativo, contacta con administración para solicitar tu alta.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => signOut()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1.5rem',
              backgroundColor: isDark ? '#1e293b' : 'var(--paper-2, #f1f5f4)',
              color: isDark ? '#ffffff' : 'var(--ink, #10201d)',
              border: `1px solid ${isDark ? '#334155' : '#dbe6e3'}`,
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <LogOut size={16} /> Cerrar Sesión y Cambiar de Cuenta
          </button>
        </div>
      </div>
    </div>
  );
};
