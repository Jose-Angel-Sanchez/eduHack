import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, enableIndexedDbPersistence, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCr1tbh9SyjnlAf-i6H8psW83Spl_RgVTs",
  authDomain: "digieduhack-b82cc.firebaseapp.com",
  projectId: "digieduhack-b82cc",
  storageBucket: "digieduhack-b82cc.firebasestorage.app",
  messagingSenderId: "159702870258",
  appId: "1:159702870258:web:44b1df0880c9fc7ef4486b",
  measurementId: "G-VKV6JPTJ0Q"
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Solo inicializar analytics en el cliente
    if (typeof window !== "undefined") {
      analytics = getAnalytics(app);
    }
    
    console.log("✅ Firebase inicializado correctamente");
    console.log("📦 Project ID:", firebaseConfig.projectId);
  } catch (error) {
    console.error("❌ Error al inicializar Firebase:", error);
    throw error;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  
  if (typeof window !== "undefined" && !analytics) {
    analytics = getAnalytics(app);
  }
}

export { app, auth, db, analytics };