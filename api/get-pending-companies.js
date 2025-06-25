// FILE: api/get-pending-companies.js
// AGGIORNATO: Semplificata la query a Firestore per evitare errori di indicizzazione.

import admin from 'firebase-admin';

// Funzione per inizializzare Firebase Admin in modo sicuro
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error.stack);
    }
  }
  return admin.firestore();
}

const db = initializeFirebaseAdmin();

export default async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- MODIFICA CHIAVE ---
    // Abbiamo rimosso la parte ".orderBy(...)" per rendere la query più semplice e
    // per evitare errori se l'indice non è stato creato manualmente su Firestore.
    // Leggiamo sia le aziende in pending che quelle attive.
    
    const pendingSnapshot = await db.collection('pendingCompanies').get();
    const activeSnapshot = await db.collection('activeCompanies').get();
    
    const pendingCompanies = [];
    pendingSnapshot.forEach(doc => {
      pendingCompanies.push({ id: doc.id, ...doc.data() });
    });

    const activeCompanies = [];
    activeSnapshot.forEach(doc => {
      activeCompanies.push({ id: doc.id, ...doc.data() });
    });

    // Restituiamo un oggetto JSON ben formato con entrambe le liste
    res.status(200).json({ pending: pendingCompanies, active: activeCompanies });

  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
