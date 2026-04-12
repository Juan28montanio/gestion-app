import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBM6WGLQDWhxBkvOWqL-PuSJ-OPBZcIHMQ",
  authDomain: "gestion-app-b1aae.firebaseapp.com",
  projectId: "gestion-app-b1aae",
  storageBucket: "gestion-app-b1aae.firebasestorage.app",
  messagingSenderId: "888132165307",
  appId: "1:888132165307:web:45ddbd8782ce063acc539e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
