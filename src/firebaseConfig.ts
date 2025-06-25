// FILE: src/firebaseConfig.ts

import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Leggiamo le credenziali dalle Environment Variables di Vercel.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Controlla che le variabili siano state caricate per un debug più facile
if (!firebaseConfig.projectId) {
  console.error("Configurazione di Firebase non trovata. Assicurati di aver impostato le variabili d'ambiente VITE_ su Vercel e di aver fatto un redeploy.");
}

// Inizializza Firebase solo se non è già stato fatto per evitare errori
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);

// Esporta le istanze per poterle usare nel resto dell'applicazione
export { app, db };
