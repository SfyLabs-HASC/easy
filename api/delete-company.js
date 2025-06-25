// FILE: api/delete-company.js
// Gestisce l'eliminazione di un'azienda dal database.

import admin from 'firebase-admin';

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
        } catch (error) { console.error('Firebase init error', error.stack); }
    }
    return admin.firestore();
}
const db = initializeFirebaseAdmin();

export default async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    try {
        const { walletAddress, status } = req.body;
        if (!walletAddress || !status) return res.status(400).json({ error: "Dati mancanti." });
        
        if (status === "pending") {
            await db.collection('pendingCompanies').doc(walletAddress).delete();
        } else if (status === "deactivated") {
            await db.collection('activeCompanies').doc(walletAddress).delete();
        } else {
            return res.status(403).json({ error: "Non puoi eliminare un'azienda attiva." });
        }
        res.status(200).json({ message: "Azienda eliminata con successo." });
    } catch (error) { res.status(500).json({ error: "Internal Server Error" }); }
};
