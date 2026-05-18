import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login,
  logout,
  registerOwner,
  subscribeToAuthSession,
  updateBusinessAccount,
  updateBusinessUserProfile,
  verifyBusinessAuditPin,
  verifySessionPassword,
} from "../services/app/authGateway";

const AuthContext = createContext(null);

async function resetBusinessWorkspace() {
  throw new Error("El reinicio de espacio de trabajo se migrara a una RPC Supabase antes de habilitarlo.");
}

export function AuthProvider({ children }) {
  const [authSession, setAuthSession] = useState({
    currentUser: null,
    userProfile: null,
    business: null,
    businessId: "",
    authError: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthSession((nextSession) => {
      setAuthSession(nextSession);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      currentUser: authSession.currentUser,
      userProfile: authSession.userProfile,
      business: authSession.business,
      businessId: authSession.businessId || "",
      authError: authSession.authError || null,
      isLoading,
      login,
      registerOwner,
      logout,
      verifySessionPassword,
      saveBusinessAccount: updateBusinessAccount,
      saveUserProfile: updateBusinessUserProfile,
      verifyAuditPin: verifyBusinessAuditPin,
      resetWorkspace: resetBusinessWorkspace,
    }),
    [authSession, isLoading]
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
