// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAkSmlvtBalh-UJKvJln0Ld6WXrrKn5VEs",
  authDomain: "lhhousenoti.firebaseapp.com",
  projectId: "lhhousenoti",
  storageBucket: "lhhousenoti.firebasestorage.app",
  messagingSenderId: "889147796562",
  appId: "1:889147796562:web:968cf034a8bd30b4a9038b",
  measurementId: "G-2FWZ1QHDK2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 사용할 서비스 export
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
