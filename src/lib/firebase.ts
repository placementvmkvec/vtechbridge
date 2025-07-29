// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAncQG7Z0Y7XL9TTVNn8Cfji4NOu0Wqrwk",
  authDomain: "vtechbridge.firebaseapp.com",
  projectId: "vtechbridge",
  storageBucket: "vtechbridge.firebasestorage.app",
  messagingSenderId: "281899053981",
  appId: "1:281899053981:web:b6c9abd8704b5b370a3574",
  measurementId: "G-H5BGJCLZYD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
