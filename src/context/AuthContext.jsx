import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import {
  LEGACY_BUSINESS_ID,
  loginWithEmailPassword,
  reauthenticateCurrentUserPassword,
  logoutUser,
  registerBusinessOwner,
} from "../services/authService";
import {
  migrateLegacyBusinessUser,
  subscribeToBusiness,
  subscribeToBusinessUser,
  updateBusinessAccount,
  updateBusinessUserProfile,
  verifyBusinessAuditPin,
} from "../services/businessService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileResolved, setIsProfileResolved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserProfile(null);
      setBusiness(null);
      setIsProfileResolved(!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) {
      setUserProfile(null);
      setIsProfileResolved(true);
      return undefined;
    }

    const unsubscribe = subscribeToBusinessUser(currentUser.uid, (profile) => {
      setUserProfile(profile || null);
      setIsProfileResolved(true);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.uid || !userProfile?.business_id) {
      return undefined;
    }

    let isCancelled = false;

    const runMigration = async () => {
      if (userProfile.business_id !== LEGACY_BUSINESS_ID) {
        return;
      }

      setIsProfileResolved(false);

      try {
        await migrateLegacyBusinessUser(currentUser, userProfile);
      } finally {
        if (!isCancelled) {
          setIsProfileResolved(true);
        }
      }
    };

    runMigration();

    return () => {
      isCancelled = true;
    };
  }, [currentUser, userProfile]);

  useEffect(() => {
    if (!isProfileResolved) {
      return undefined;
    }

    const businessId = userProfile?.business_id || "";
    if (!businessId) {
      setBusiness(null);
      return undefined;
    }

    const unsubscribe = subscribeToBusiness(businessId, (currentBusiness) => {
      setBusiness(
        currentBusiness || {
          id: businessId,
          name: "SmartProfit",
          logo_url: "",
        }
      );
    });

    return () => unsubscribe();
  }, [isProfileResolved, userProfile]);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      business,
      businessId: business?.id || userProfile?.business_id || "",
      isLoading: isLoading || (Boolean(currentUser) && !isProfileResolved),
      login: loginWithEmailPassword,
      registerOwner: registerBusinessOwner,
      logout: logoutUser,
      verifySessionPassword: reauthenticateCurrentUserPassword,
      saveBusinessAccount: updateBusinessAccount,
      saveUserProfile: updateBusinessUserProfile,
      verifyAuditPin: verifyBusinessAuditPin,
    }),
    [business, currentUser, isLoading, isProfileResolved, userProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider.");
  }
  return context;
}
