import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export const LEGACY_BUSINESS_ID = "demo_restaurant_business";

export function buildBusinessId(userId) {
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("No fue posible generar el identificador del negocio.");
  }

  return `business_${normalizedUserId}`;
}

export async function registerBusinessOwner({
  businessName,
  adminName,
  email,
  password,
}) {
  const normalizedBusinessName = String(businessName || "").trim();
  const normalizedAdminName = String(adminName || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedBusinessName) {
    throw new Error("El nombre del negocio es obligatorio.");
  }

  if (!normalizedAdminName) {
    throw new Error("El nombre del administrador es obligatorio.");
  }

  if (!normalizedEmail) {
    throw new Error("El correo es obligatorio.");
  }

  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  await updateProfile(credential.user, { displayName: normalizedAdminName });

  const businessId = buildBusinessId(credential.user.uid);

  const businessRef = doc(db, "businesses", businessId);
  const existingBusinessSnapshot = await getDoc(businessRef);

  await setDoc(
    businessRef,
    {
      name: normalizedBusinessName,
      logo_url: "",
      owner_user_id:
        existingBusinessSnapshot.exists()
          ? existingBusinessSnapshot.data().owner_user_id || credential.user.uid
          : credential.user.uid,
      owner_name:
        existingBusinessSnapshot.exists()
          ? existingBusinessSnapshot.data().owner_name || normalizedAdminName
          : normalizedAdminName,
      createdAt: existingBusinessSnapshot.exists()
        ? existingBusinessSnapshot.data().createdAt || serverTimestamp()
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "business_users", credential.user.uid),
    {
      business_id: businessId,
      display_name: normalizedAdminName,
      email: normalizedEmail,
      role: "owner",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return credential.user;
}

export async function loginWithEmailPassword(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("El correo es obligatorio.");
  }

  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return credential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function reauthenticateCurrentUserPassword(password) {
  const currentUser = auth.currentUser;
  const normalizedPassword = String(password || "");

  if (!currentUser?.email) {
    throw new Error("No hay una sesion activa para validar la identidad.");
  }

  if (!normalizedPassword) {
    throw new Error("Debes ingresar la contrasena actual para continuar.");
  }

  const credential = EmailAuthProvider.credential(currentUser.email, normalizedPassword);
  await reauthenticateWithCredential(currentUser, credential);
  return true;
}
