import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function getFirebaseEnv(name) {
  const value = import.meta.env[name];

  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Configura Firebase en tu archivo .env.`
    );
  }

  return value;
}

const firebaseConfig = {
  apiKey: getFirebaseEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getFirebaseEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getFirebaseEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getFirebaseEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getFirebaseEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getFirebaseEnv("VITE_FIREBASE_APP_ID"),
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
