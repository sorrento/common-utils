export type UserRole = 'Admin' | 'Management' | 'Operations' | 'Accounts';
export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface UserProfile {
  id: string; // Firebase UID o ID temporal de whitelist
  uid?: string;
  name: string;
  displayName?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  avatarUrl?: string;
  companyName?: string;
  department?: string;
  phone?: string;
  customNameEdited?: boolean;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface CorporateTenantConfig {
  appName: string;
  brandTagline?: string;
  companyName: string;
  adminEmail: string;
  appUrl?: string;
  theme?: 'light' | 'dark';
}

export interface CorporateAuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: any | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  tenantConfig: CorporateTenantConfig;
}
