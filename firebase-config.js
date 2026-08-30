import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCZ2V9OmilEyeeNlgrT1khF2YH1sojLgcM',
  authDomain: 'chandrakala-bd6f8.firebaseapp.com',
  projectId: 'chandrakala-bd6f8',
  storageBucket: 'chandrakala-bd6f8.firebasestorage.app',
  messagingSenderId: '788925901605',
  appId: '1:788925901605:web:b9f3dd03923b08fe5448cc',
  measurementId: 'G-41W0ZVZWBP'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const ADMIN_EMAIL = 'admin@chandrakala.com';
