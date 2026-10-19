import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { UserProfile, CorporateTenantConfig, CorporateAuthContextType } from '../types';
import { CorporateUserService, isSuperAdminEmail } from '../services/corporateUserService';
import { formatNameFromEmail } from '../utils/userFormatters';

const CorporateAuthContext = createContext<CorporateAuthContextType | undefined>(undefined);

export interface CorporateAuthProviderProps {
  auth: Auth;
  db: Firestore;
  superAdmins: string[];
  tenantConfig: CorporateTenantConfig;
  children: React.ReactNode;
}

export const CorporateAuthProvider: React.FC<CorporateAuthProviderProps> = ({
  auth,
  db,
  superAdmins,
  tenantConfig,
  children
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Instanciar el servicio desacoplado
  const userService = useMemo(() => {
    return new CorporateUserService(db, superAdmins, tenantConfig);
  }, [db, superAdmins, tenantConfig]);

  // Proveedores SSO configurados
  const googleProvider = useMemo(() => new GoogleAuthProvider(), []);
  const microsoftProvider = useMemo(() => {
    const provider = new OAuthProvider('microsoft.com');
    provider.addScope('email');
    provider.addScope('openid');
    provider.addScope('profile');
    provider.addScope('User.Read');
    return provider;
  }, []);

  // Asegurar persistencia local indefinida
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.warn('[CorporateAuth] Error setting browserLocalPersistence:', err);
    });
  }, [auth]);

  // Escuchar estado de autenticación de Firebase
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        const userEmail = user.email || user.providerData?.[0]?.email || null;
        const userName = user.displayName || user.providerData?.[0]?.displayName || null;
        const userPhoto = user.photoURL || user.providerData?.[0]?.photoURL || null;

        try {
          const profile = await userService.syncAuthUser({
            uid: user.uid,
            email: userEmail,
            displayName: userName,
            photoURL: userPhoto
          });
          setCurrentUser(profile);

          if (unsubscribeProfile) unsubscribeProfile();
          unsubscribeProfile = userService.subscribeUserProfile(user.uid, (updated) => {
            if (updated) {
              setCurrentUser(updated);
            }
          });
        } catch (err) {
          console.error('[CorporateAuth] Error sincronizando usuario:', err);
          const isSuper = isSuperAdminEmail(userEmail, superAdmins);
          setCurrentUser({
            id: user.uid,
            uid: user.uid,
            email: userEmail || '',
            name: userName || formatNameFromEmail(userEmail),
            avatar: userPhoto || '👤',
            role: isSuper ? 'Admin' : 'Operations',
            status: isSuper ? 'approved' : 'rejected',
            companyName: tenantConfig.companyName,
            createdAt: new Date().toISOString()
          });
        } finally {
          setLoading(false);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [auth, userService, superAdmins, tenantConfig]);

  const signInWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, googleProvider);
  };

  const signInWithMicrosoft = async () => {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, microsoftProvider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    await userService.updateUser(currentUser.id, updates);
    setCurrentUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const isSuper = isSuperAdminEmail(currentUser?.email, superAdmins);
  const isAdmin = isSuper || currentUser?.role === 'Admin';
  const isApproved = currentUser?.status === 'approved';

  return (
    <CorporateAuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        loading,
        isAdmin,
        isApproved,
        signInWithGoogle,
        signInWithMicrosoft,
        signOut,
        updateUserProfile,
        tenantConfig
      }}
    >
      {children}
    </CorporateAuthContext.Provider>
  );
};

export const useCorporateAuth = (): CorporateAuthContextType => {
  const context = useContext(CorporateAuthContext);
  if (!context) {
    throw new Error('useCorporateAuth must be used within a CorporateAuthProvider');
  }
  return context;
};
