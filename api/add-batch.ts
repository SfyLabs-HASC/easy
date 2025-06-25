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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo richieste POST sono ammesse' });
  }

  try {
    const { batchId, ownerAddress, name, description, date, location, imageIpfsHash, companyName } = req.body;

    if (!batchId || !ownerAddress || !name) {
      return res.status(400).json({ message: 'Dati mancanti o non validi.' });
    }

    const batchRef = db
      .collection('companies')
      .doc(ownerAddress)
      .collection('batches')
      .doc(batchId.toString());

    await batchRef.set({
      name,
      description: description || "",
      date: date || "",
      location: location || "",
      imageIpfsHash: imageIpfsHash || "N/A",
      isClosed: false,
      createdAt: new Date().toISOString(),
    });

    const companyRef = db.collection('companies').doc(ownerAddress);
    await companyRef.set({ 
        companyName: companyName || "Nome non fornito",
        walletAddress: ownerAddress 
    }, { merge: true });

    res.status(200).json({ message: 'Batch salvato con successo nella struttura aziendale.' });

  } catch (error: any) {
    console.error("Errore nel salvare su Firebase:", error);
    res.status(500).json({ message: 'Errore interno del server.', details: error.message });
  }
}
