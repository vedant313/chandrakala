import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZ2V9OmilEyeeNlgrT1khF2YH1sojLgcM",
  authDomain: "chandrakala-bd6f8.firebaseapp.com",
  projectId: "chandrakala-bd6f8",
  storageBucket: "chandrakala-bd6f8.firebasestorage.app",
  messagingSenderId: "788925901605",
  appId: "1:788925901605:web:b9f3dd03923b08fe5448cc",
  measurementId: "G-41W0ZVZWBP"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const analyticsReady =
  typeof window === "undefined"
    ? Promise.resolve(null)
    : isSupported().then((supported) => (supported ? getAnalytics(app) : null));
