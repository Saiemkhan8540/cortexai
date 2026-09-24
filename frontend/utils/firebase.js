// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "cortexai-2869a.firebaseapp.com",
  projectId: "cortexai-2869a",
  storageBucket: "cortexai-2869a.firebasestorage.app",
  messagingSenderId: "946272488177",
  appId: "1:946272488177:web:e0d3dd82d1ea6b8f7e7750"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()