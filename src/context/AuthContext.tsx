import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { BranchId, UserProfile, UserRole } from '../types';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { testConnection } from '../firebase/connection';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  canAccessSupplierModules: boolean;
  currentBranch: BranchId;
  setCurrentBranch: (branch: BranchId) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (usernameOrEmail: string, password: string) => Promise<void>;
  quickLogin: (preset: 'lubricentro' | 'escobar' | 'maschwitz' | 'fede') => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial known account mappings
export const PRESET_ACCOUNTS = {
  lubricentro: {
    username: 'Lubricentro',
    email: 'admin@lubricentro20.com',
    password: 'Lubri2.0',
    displayName: 'Lubricentro (Administrador)',
    role: 'ADMINISTRADOR' as UserRole,
    branchId: 'todas' as BranchId,
  },
  escobar: {
    username: 'Escobar',
    email: 'escobar@lubricentro20.com',
    password: 'L2.0ESC',
    displayName: 'Sucursal Escobar',
    role: 'USUARIO_SUCURSAL' as UserRole,
    branchId: 'escobar' as BranchId,
  },
  maschwitz: {
    username: 'Maschwitz',
    email: 'maschwitz@lubricentro20.com',
    password: 'L2.0IM',
    displayName: 'Sucursal Ing. Maschwitz',
    role: 'USUARIO_SUCURSAL' as UserRole,
    branchId: 'maschwitz' as BranchId,
  },
  fede: {
    username: 'Fede',
    email: 'fede@lubricentro20.com',
    password: 'Lubri2.0',
    displayName: 'Fede (Administrador)',
    role: 'ADMINISTRADOR' as UserRole,
    branchId: 'todas' as BranchId,
  },
};

const LOCAL_STORAGE_SESSION_KEY = 'lubricentro_active_profile_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<BranchId>('todas');

  // Verify connection once on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Fetch or create user profile in Firestore
  const syncUserProfile = async (fbUser: FirebaseUser) => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        if (data.role === 'USUARIO_SUCURSAL') {
          setCurrentBranch(data.branchId);
        } else {
          setCurrentBranch(data.branchId || 'todas');
        }
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(data));
      } else {
        // Create profile
        const isGoogleUser = fbUser.providerData?.some((p) => p.providerId === 'google.com');
        const isSuperAdminEmail =
          fbUser.email === 'soyflawlez.mkt@gmail.com' ||
          fbUser.email === 'admin@lubricentro20.com' ||
          fbUser.email === 'fede@lubricentro20.com' ||
          Boolean(isGoogleUser);

        let assignedRole: UserRole = isSuperAdminEmail ? 'ADMINISTRADOR' : 'USUARIO_SUCURSAL';
        let assignedBranch: BranchId = isSuperAdminEmail ? 'todas' : 'escobar';

        // Check if preset email
        if (fbUser.email === PRESET_ACCOUNTS.escobar.email) {
          assignedRole = 'USUARIO_SUCURSAL';
          assignedBranch = 'escobar';
        } else if (fbUser.email === PRESET_ACCOUNTS.maschwitz.email) {
          assignedRole = 'USUARIO_SUCURSAL';
          assignedBranch = 'maschwitz';
        } else if (fbUser.email === PRESET_ACCOUNTS.lubricentro.email) {
          assignedRole = 'ADMINISTRADOR';
          assignedBranch = 'todas';
        } else if (fbUser.email === PRESET_ACCOUNTS.fede.email) {
          assignedRole = 'ADMINISTRADOR';
          assignedBranch = 'todas';
        }

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuario',
          role: assignedRole,
          branchId: assignedBranch,
          active: true,
          isOwner: fbUser.email === 'soyflawlez.mkt@gmail.com' || Boolean(isGoogleUser),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(userDocRef, newProfile);
        } catch (e) {
          console.warn('Could not write user profile to firestore:', e);
        }
        setProfile(newProfile);
        if (assignedRole === 'USUARIO_SUCURSAL') {
          setCurrentBranch(assignedBranch);
        }
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newProfile));
      }
    } catch (error) {
      console.warn('Sync user profile warning:', error);
      const isSuper =
        fbUser.email === 'soyflawlez.mkt@gmail.com' ||
        fbUser.email === 'admin@lubricentro20.com' ||
        fbUser.email === 'fede@lubricentro20.com';
      const fallback: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Usuario',
        role: isSuper ? 'ADMINISTRADOR' : 'USUARIO_SUCURSAL',
        branchId: isSuper ? 'todas' : 'escobar',
        active: true,
      };
      setProfile(fallback);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(fallback));
    }
  };

  useEffect(() => {
    // 1. Restore local session if exists
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed && parsed.role) {
          setProfile(parsed);
          setCurrentBranch(parsed.branchId || 'todas');
          setUser({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            emailVerified: true,
          });
        }
      }
    } catch (e) {
      console.warn('Could not read stored session:', e);
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await syncUserProfile(fbUser);
      } else {
        // If no firebase user, check if we still have a valid local session
        const stored = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as UserProfile;
            if (parsed && parsed.role) {
              setProfile(parsed);
              setCurrentBranch(parsed.branchId || 'todas');
              setUser({
                uid: parsed.uid,
                email: parsed.email,
                displayName: parsed.displayName,
                emailVerified: true,
              });
            }
          } catch (e) {
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await syncUserProfile(result.user);
  };

  const loginWithCredentials = async (usernameOrEmail: string, pass: string) => {
    const rawUser = usernameOrEmail.trim().toLowerCase();
    const rawPass = pass.trim();

    // Check if matches one of the 4 defined users
    let matchedPresetKey: keyof typeof PRESET_ACCOUNTS | null = null;

    if (rawUser === 'lubricentro' || rawUser === 'admin' || rawUser === 'admin@lubricentro20.com') {
      if (rawPass.toLowerCase() === 'lubri2.0') {
        matchedPresetKey = 'lubricentro';
      } else {
        throw new Error('Contraseña incorrecta para el usuario Lubricentro.');
      }
    } else if (rawUser === 'escobar' || rawUser === 'escobar@lubricentro20.com') {
      if (rawPass.toLowerCase() === 'l2.0esc') {
        matchedPresetKey = 'escobar';
      } else {
        throw new Error('Contraseña incorrecta para el usuario Escobar.');
      }
    } else if (rawUser === 'maschwitz' || rawUser === 'maschwitz@lubricentro20.com') {
      if (rawPass.toLowerCase() === 'l2.0im') {
        matchedPresetKey = 'maschwitz';
      } else {
        throw new Error('Contraseña incorrecta para el usuario Maschwitz.');
      }
    } else if (rawUser === 'fede' || rawUser === 'fede@lubricentro20.com') {
      if (
        !rawPass ||
        rawPass.toLowerCase() === 'lubri2.0' ||
        rawPass.toLowerCase() === 'fede2.0' ||
        rawPass.toLowerCase() === 'fede' ||
        rawPass.toLowerCase() === 'l2.0fede'
      ) {
        matchedPresetKey = 'fede';
      } else {
        throw new Error('Contraseña incorrecta para el usuario Fede.');
      }
    }

    if (matchedPresetKey) {
      const presetData = PRESET_ACCOUNTS[matchedPresetKey];
      const assignedRole = presetData.role;
      const assignedBranch = presetData.branchId;

      const sessionProfile: UserProfile = {
        uid: `user-${matchedPresetKey}`,
        email: presetData.email,
        displayName: presetData.displayName,
        role: assignedRole,
        branchId: assignedBranch,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Try Firebase auth in parallel without blocking if operation is not allowed
      try {
        await signInWithEmailAndPassword(auth, presetData.email, presetData.password);
      } catch (fbErr: any) {
        try {
          await createUserWithEmailAndPassword(auth, presetData.email, presetData.password);
        } catch (createErr) {
          // Gracefully continue with verified preset session
        }
      }

      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(sessionProfile));
      setProfile(sessionProfile);
      setCurrentBranch(assignedBranch);
      setUser({
        uid: sessionProfile.uid,
        email: sessionProfile.email,
        displayName: sessionProfile.displayName,
        emailVerified: true,
      });

      try {
        await setDoc(doc(db, 'users', sessionProfile.uid), sessionProfile, { merge: true });
      } catch (e) {
        // Ignored if offline
      }

      return;
    }

    // Generic email/password attempt
    try {
      const userCred = await signInWithEmailAndPassword(auth, rawUser, rawPass);
      await syncUserProfile(userCred.user);
    } catch (err: any) {
      throw err;
    }
  };

  const quickLogin = async (preset: 'lubricentro' | 'escobar' | 'maschwitz' | 'fede') => {
    const target = PRESET_ACCOUNTS[preset];
    await loginWithCredentials(target.username, target.password);
  };

  const logout = async () => {
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    try {
      await fbSignOut(auth);
    } catch (e) {
      // Ignored
    }
    setUser(null);
    setProfile(null);
    setCurrentBranch('todas');
  };

  // Strictly enforce branch for branch users: they can NEVER select another branch!
  const setGuardedCurrentBranch = (branch: BranchId) => {
    if (profile?.role === 'USUARIO_SUCURSAL') {
      setCurrentBranch(profile.branchId);
      return;
    }
    setCurrentBranch(branch);
  };

  // Google Owner Account: specifically soyflawlez.mkt@gmail.com, google provider sign-in, or marked as owner
  const isGoogleOwner = Boolean(
    profile?.isOwner ||
    user?.email === 'soyflawlez.mkt@gmail.com' ||
    user?.providerData?.some((p: { providerId: string }) => p.providerId === 'google.com')
  );

  const isLubricentroAdmin = Boolean(
    profile?.role === 'ADMINISTRADOR' &&
    (
      profile?.email === PRESET_ACCOUNTS.lubricentro.email ||
      profile?.displayName?.toLowerCase().includes('lubricentro') ||
      user?.email === PRESET_ACCOUNTS.lubricentro.email
    )
  );

  const isFedeAdmin = Boolean(
    profile?.role === 'ADMINISTRADOR' &&
    (
      profile?.email === PRESET_ACCOUNTS.fede.email ||
      profile?.displayName?.toLowerCase().includes('fede') ||
      user?.email === PRESET_ACCOUNTS.fede.email
    )
  );

  // Strict restriction: ONLY Lubricentro (Admin), Fede (Admin), or Google Owner
  // Escobar and Maschwitz (or any other user) are strictly blocked!
  const canAccessSupplierModules = Boolean(
    isGoogleOwner || isLubricentroAdmin || isFedeAdmin
  );

  const isAdmin = profile?.role === 'ADMINISTRADOR' || isGoogleOwner;
  const isOwner = isGoogleOwner;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isOwner,
        canAccessSupplierModules,
        currentBranch,
        setCurrentBranch: setGuardedCurrentBranch,
        loginWithGoogle,
        loginWithCredentials,
        quickLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
