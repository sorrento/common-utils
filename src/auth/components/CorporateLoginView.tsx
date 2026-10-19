import React, { useState } from 'react';
import { useCorporateAuth } from '../context/CorporateAuthContext';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const CorporateLoginView: React.FC = () => {
  const { signInWithGoogle, signInWithMicrosoft, tenantConfig } = useCorporateAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = tenantConfig.theme === 'dark';

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('La ventana de autenticación fue cerrada antes de completar el inicio de sesión.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Dominio no autorizado en Firebase Console. Por favor verifica los Dominios Autorizados.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('El inicio de sesión con Google no está habilitado en Firebase Console.');
      } else {
        setErrorMsg(`${err.code || 'Error'}: ${err.message || 'No se pudo conectar con Google'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      await signInWithMicrosoft();
    } catch (err: any) {
      console.error('Microsoft sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('La ventana de autenticación fue cerrada antes de completar el inicio de sesión.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Dominio no autorizado en Firebase Console. Por favor verifica los Dominios Autorizados.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('El inicio de sesión con Microsoft no está habilitado en Firebase Console.');
      } else {
        setErrorMsg(`${err.code || 'Error'}: ${err.message || 'No se pudo conectar con Microsoft'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
        maxWidth: '460px',
        width: '100%',
        backgroundColor: isDark ? '#0d1527' : '#ffffff',
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          : '0 20px 60px rgba(16, 32, 29, 0.08), 0 0 0 1px #dbe6e3',
        padding: '2.5rem',
        position: 'relative',
        zIndex: 1,
        color: isDark ? '#f8fafc' : 'var(--ink, #10201d)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '999px',
            backgroundColor: isDark ? 'rgba(2, 132, 199, 0.15)' : 'var(--ink, #10201d)',
            color: isDark ? '#38bdf8' : 'var(--teal, #00bfa8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            fontWeight: 900,
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(16, 32, 29, 0.15)'
          }}>
            {tenantConfig.appName.substring(0, 2)}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: isDark ? '#ffffff' : 'var(--ink, #10201d)', letterSpacing: '-0.03em', margin: 0 }}>
            {tenantConfig.appName}
          </h1>
          {tenantConfig.brandTagline && (
            <div style={{ fontSize: '0.85rem', color: isDark ? '#38bdf8' : 'var(--teal-dark, #008b7e)', fontWeight: 800, letterSpacing: '0.04em', marginTop: '0.25rem', textTransform: 'uppercase' }}>
              {tenantConfig.brandTagline}
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : 'var(--muted, #60706c)', marginTop: '0.6rem' }}>
            Portal Corporativo Seguro · {tenantConfig.companyName}
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(223, 63, 69, 0.08)',
            border: '1px solid rgba(223, 63, 69, 0.25)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: '#df3f45',
            fontSize: '0.85rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMsg}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <button
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '13px 18px',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#dbe6e3'}`,
              borderRadius: '10px',
              color: isDark ? '#ffffff' : 'var(--ink, #10201d)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continuar con Google</span>
            <ArrowRight size={16} color="gray" style={{ marginLeft: 'auto' }} />
          </button>

          <button
            onClick={handleMicrosoftLogin}
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '13px 18px',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#dbe6e3'}`,
              borderRadius: '10px',
              color: isDark ? '#ffffff' : 'var(--ink, #10201d)',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span>Continuar con Microsoft</span>
            <ArrowRight size={16} color="gray" style={{ marginLeft: 'auto' }} />
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'var(--paper-2, #f1f5f4)',
          borderRadius: '10px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#dbe6e3'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={20} color={isDark ? '#38bdf8' : 'var(--teal-dark, #008b7e)'} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : 'var(--muted, #60706c)', lineHeight: 1.4 }}>
            <strong>Acceso Restringido:</strong> Solo cuentas en lista blanca institucional autorizadas por <span style={{ color: isDark ? '#ffffff' : 'var(--ink, #10201d)', fontWeight: 700 }}>{tenantConfig.companyName}</span> pueden acceder.
          </div>
        </div>
      </div>
    </div>
  );
};
