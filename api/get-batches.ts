import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS!))
    });
  } catch (error: any) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Solo richieste GET sono ammesse' });
  }

  try {
    const { userAddress } = req.query;

    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({ message: 'Indirizzo utente non fornito.' });
    }

    const batchesRef = db
      .collection('companies')
      .doc(userAddress)
      .collection('batches')
      .orderBy('createdAt', 'desc');
      
    const snapshot = await batchesRef.get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const batches: any[] = [];
    snapshot.forEach(doc => {
      batches.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(batches);

  } catch (error: any) {
    console.error("Errore nel leggere da Firebase:", error);
    res.status(500).json({ message: 'Errore interno del server.', details: error.message });
  }
}
