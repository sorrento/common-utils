# 🔐 Módulo Reutilizable: Corporate Auth & Whitelist (Google + Microsoft + Resend)

Este módulo proporciona autenticación corporativa con lista blanca en Firestore (`users`), inicio de sesión con Google Workspace y Microsoft 365 Entra ID, alertas automáticas de intentos no autorizados y gestión administrativa de accesos.

---

## 🚀 Cómo usarlo en cualquier aplicación nueva (en 3 pasos)

### 1. Envolver la aplicación con `<CorporateAuthProvider>` en `main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CorporateAuthProvider } from './common-utils';
import { auth, db } from './firebase/config';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CorporateAuthProvider
      auth={auth}
      db={db}
      superAdmins={['brain@npr.cl', 'bladerunner@npr.cl']}
      tenantConfig={{
        appName: 'Mi Nueva App',
        brandTagline: 'Corporate Portal',
        companyName: 'NPR Europa',
        adminEmail: 'brain@npr.cl',
        theme: 'light' // o 'dark'
      }}
    >
      <App />
    </CorporateAuthProvider>
  </StrictMode>
);
```

---

### 2. Proteger la aplicación con `<CorporateAuthGate>` en `App.tsx`

`<CorporateAuthGate>` se encarga de todo el ciclo de vida:
- Si está cargando ➔ muestra spinner de branding corporativo.
- Si no está logueado ➔ muestra pantalla de Login (Google + MS).
- Si no está en lista blanca ➔ muestra pantalla de acceso no autorizado y despacha alerta por email.
- Si está autorizado ➔ renderiza tu aplicación.

```tsx
import { CorporateAuthGate, CorporateWhitelistManager, useCorporateAuth } from './common-utils';
import { db } from './firebase/config';

export function App() {
  const { isAdmin } = useCorporateAuth();

  return (
    <CorporateAuthGate>
      <div className="mi-layout">
        {/* Tu aplicación normal */}
        
        {/* Pestaña o modal de administración para gestionar la lista blanca */}
        {isAdmin && (
          <CorporateWhitelistManager 
            db={db} 
            superAdmins={['brain@npr.cl', 'bladerunner@npr.cl']} 
          />
        )}
      </div>
    </CorporateAuthGate>
  );
}
```

---

### 3. Usar el usuario activo en cualquier componente

```tsx
import { useCorporateAuth, getUserInitials } from './common-utils';

export function Navbar() {
  const { currentUser, isAdmin, signOut } = useCorporateAuth();

  return (
    <div>
      <span>{currentUser?.name} ({currentUser?.role})</span>
      <button onClick={() => signOut()}>Cerrar Sesión</button>
    </div>
  );
}
```

---

## 🛡️ Seguridad de Correos (Cero claves en el Frontend)

- El frontend **NUNCA** tiene la clave de Resend.
- En desarrollo local: las llamadas a enviar correos van a `/api/send-email` (proxy de `vite.config.ts`).
- En producción: van a la Cloud Function segura `https://us-central1-artbpo.cloudfunctions.net/sendEmail`.
