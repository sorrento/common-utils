import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Firestore
} from 'firebase/firestore';
import type { UserProfile, UserRole, CorporateTenantConfig } from '../types';
import { sendUnauthorizedAccessAlert, sendWhitelistInvitationEmail } from './corporateEmailService';
import { formatNameFromEmail } from '../utils/userFormatters';

const USERS_COLLECTION = 'users';

export function isSuperAdminEmail(email?: string | null, superAdmins: string[] = []): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return superAdmins.some(admin => admin.toLowerCase().trim() === normalized);
}

export class CorporateUserService {
  private db: Firestore;
  private superAdmins: string[];
  private tenant: CorporateTenantConfig;

  constructor(db: Firestore, superAdmins: string[], tenant: CorporateTenantConfig) {
    this.db = db;
    this.superAdmins = superAdmins;
    this.tenant = tenant;
  }

  async syncAuthUser(authUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<UserProfile> {
    const userRef = doc(this.db, USERS_COLLECTION, authUser.uid);
    const snap = await getDoc(userRef);

    const email = (authUser.email || '').toLowerCase().trim();
    const isSuper = isSuperAdminEmail(email, this.superAdmins);

    // 1. Si ya existe el documento con su UID
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      const updates: Partial<UserProfile> = {};

      if (data.status === 'rejected') {
        const qEmail = query(collection(this.db, USERS_COLLECTION), where('email', '==', email));
        const qSnap = await getDocs(qEmail);
        const approvedDoc = qSnap.docs.find(d => d.data().status === 'approved');

        if (approvedDoc || isSuper) {
          const preData = approvedDoc?.data() as UserProfile | undefined;
          updates.status = 'approved';
          updates.role = isSuper ? 'Admin' : (preData?.role || 'Operations');
          updates.companyName = isSuper ? this.tenant.companyName : (preData?.companyName || data.companyName || this.tenant.companyName);
          updates.department = preData?.department || data.department || '';
          updates.approvedAt = new Date().toISOString();
          updates.approvedBy = 'System/Admin';

          if (approvedDoc && approvedDoc.id !== authUser.uid) {
            try {
              await deleteDoc(doc(this.db, USERS_COLLECTION, approvedDoc.id));
            } catch (e) {
              console.warn('Error eliminando doc temporal de whitelist:', e);
            }
          }
        }
      }

      if (!data.customNameEdited) {
        if (authUser.displayName) {
          updates.name = authUser.displayName;
        } else if (!data.name || data.name === 'Usuario') {
          updates.name = formatNameFromEmail(email);
        }
      }
      if (authUser.photoURL && (!data.avatar || data.avatar === '👤')) {
        updates.avatar = authUser.photoURL;
      }
      if (isSuper && (data.role !== 'Admin' || data.status !== 'approved')) {
        updates.role = 'Admin';
        updates.status = 'approved';
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await updateDoc(userRef, updates);
        return { ...data, ...updates, id: authUser.uid };
      }
      return { ...data, id: authUser.uid };
    }

    // 2. Buscar si existe en la Whitelist por EMAIL
    const qEmail = query(collection(this.db, USERS_COLLECTION), where('email', '==', email));
    const querySnap = await getDocs(qEmail);

    let preRegisteredData: UserProfile | null = null;
    let oldDocIdToDelete: string | null = null;

    if (!querySnap.empty) {
      const foundDoc = querySnap.docs.find(d => d.data().status === 'approved') || querySnap.docs[0];
      preRegisteredData = foundDoc.data() as UserProfile;
      if (foundDoc.id !== authUser.uid) {
        oldDocIdToDelete = foundDoc.id;
      }
    }

    let finalStatus: UserProfile['status'] = 'rejected';
    let finalRole: UserRole = 'Operations';
    let companyName = this.tenant.companyName;
    let department = '';

    if (isSuper) {
      finalStatus = 'approved';
      finalRole = 'Admin';
    } else if (preRegisteredData && preRegisteredData.status === 'approved') {
      finalStatus = 'approved';
      finalRole = preRegisteredData.role || 'Operations';
      companyName = preRegisteredData.companyName || this.tenant.companyName;
      department = preRegisteredData.department || '';
    }

    const resolvedName = authUser.displayName || preRegisteredData?.name || formatNameFromEmail(email);

    const newProfile: UserProfile = {
      id: authUser.uid,
      uid: authUser.uid,
      email,
      name: resolvedName,
      role: finalRole,
      status: finalStatus,
      avatar: authUser.photoURL || preRegisteredData?.avatar || '👤',
      companyName,
      department,
      customNameEdited: Boolean(preRegisteredData?.customNameEdited),
      createdAt: preRegisteredData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: finalStatus === 'approved' ? new Date().toISOString() : undefined,
      approvedBy: isSuper ? 'SuperAdmin' : (preRegisteredData?.approvedBy || undefined)
    };

    await setDoc(userRef, newProfile);

    if (oldDocIdToDelete) {
      try {
        await deleteDoc(doc(this.db, USERS_COLLECTION, oldDocIdToDelete));
      } catch (e) {
        console.warn('Error eliminando doc temporal de pre-registro:', e);
      }
    }

    if (finalStatus === 'rejected') {
      sendUnauthorizedAccessAlert({
        adminEmail: this.tenant.adminEmail,
        attemptEmail: email,
        attemptName: authUser.displayName || undefined,
        attemptTime: new Date().toLocaleString(),
        appName: this.tenant.appName,
        companyName: this.tenant.companyName
      }).catch(err => console.warn('Error enviando alerta de acceso no autorizado:', err));
    }

    return newProfile;
  }

  subscribeUserProfile(uid: string, callback: (user: UserProfile | null) => void): () => void {
    const userRef = doc(this.db, USERS_COLLECTION, uid);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ ...snapshot.data(), id: snapshot.id } as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error escuchando perfil de usuario:', error);
    });
  }

  subscribeAllUsers(callback: (users: UserProfile[], err?: any) => void): () => void {
    const q = query(collection(this.db, USERS_COLLECTION));
    return onSnapshot(q, (snap) => {
      const users = snap.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
      callback(users);
    }, (err) => {
      console.error('Error escuchando usuarios:', err);
      callback([], err);
    });
  }

  /**
   * Asegura que todos los superAdmins estén pre-registrados en la colección users
   */
  async seedSuperAdmins(): Promise<void> {
    for (const email of this.superAdmins) {
      const normalizedEmail = email.toLowerCase().trim();
      const qEmail = query(collection(this.db, USERS_COLLECTION), where('email', '==', normalizedEmail));
      const querySnap = await getDocs(qEmail);

      if (querySnap.empty) {
        const tempId = `admin_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const adminEntry: UserProfile = {
          id: tempId,
          email: normalizedEmail,
          name: formatNameFromEmail(normalizedEmail),
          role: 'Admin',
          status: 'approved',
          companyName: this.tenant.companyName,
          department: 'Executive Administration',
          avatar: '👤',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'System (SuperAdmin)'
        };
        await setDoc(doc(this.db, USERS_COLLECTION, tempId), adminEntry);
      }
    }
  }

  async addToWhitelist(params: {
    email: string;
    name: string;
    role: UserRole;
    companyName?: string;
    department?: string;
    approvedBy: string;
    sendNotification?: boolean;
  }): Promise<void> {
    const normalizedEmail = params.email.toLowerCase().trim();

    const qEmail = query(collection(this.db, USERS_COLLECTION), where('email', '==', normalizedEmail));
    const querySnap = await getDocs(qEmail);

    if (!querySnap.empty) {
      const existingDoc = querySnap.docs[0];
      await updateDoc(doc(this.db, USERS_COLLECTION, existingDoc.id), {
        name: params.name || existingDoc.data().name,
        role: params.role,
        status: 'approved',
        companyName: params.companyName || existingDoc.data().companyName || this.tenant.companyName,
        department: params.department || existingDoc.data().department || '',
        approvedAt: new Date().toISOString(),
        approvedBy: params.approvedBy,
        updatedAt: new Date().toISOString()
      });
    } else {
      const tempId = `whitelist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newEntry: UserProfile = {
        id: tempId,
        email: normalizedEmail,
        name: params.name || formatNameFromEmail(normalizedEmail),
        role: params.role,
        status: 'approved',
        companyName: params.companyName || this.tenant.companyName,
        department: params.department || '',
        avatar: '👤',
        createdAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: params.approvedBy,
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(this.db, USERS_COLLECTION, tempId), newEntry);
    }

    if (params.sendNotification !== false) {
      sendWhitelistInvitationEmail({
        recipientEmail: normalizedEmail,
        recipientName: params.name || formatNameFromEmail(normalizedEmail),
        assignedRole: params.role,
        companyName: params.companyName || this.tenant.companyName,
        appName: this.tenant.appName,
        appUrl: this.tenant.appUrl,
        adminEmail: this.tenant.adminEmail
      }).catch(err => console.warn('Error enviando email de bienvenida:', err));
    }
  }

  async updateUser(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(this.db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
  }
}
