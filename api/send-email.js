// FILE: api/send-email.js
// AGGIORNATO: L'oggetto dell'email ora è personalizzato con il nome dell'azienda.

import { Resend } from 'resend';
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
const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { companyName, contactEmail, sector, walletAddress, ...socials } = req.body;

    // --- Salvataggio su Firestore (invariato) ---
    const pendingRef = db.collection('pendingCompanies').doc(walletAddress);
    await pendingRef.set({
      companyName,
      contactEmail,
      sector,
      walletAddress,
      status: 'pending',
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...socials,
    });
    
    // --- Invio Email (con Oggetto Aggiornato) ---
    const { data, error } = await resend.emails.send({
      from: 'Easy Chain <onboarding@resend.dev>',
      to: ['sfy.startup@gmail.com'],
      // MODIFICA CHIAVE: L'oggetto ora usa il nome dell'azienda per primo.
      subject: `${companyName} - Richiesta Attivazione`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2>Nuova Richiesta di Attivazione</h2>
          <p>L'azienda "${companyName}" ha richiesto l'attivazione sulla piattaforma Easy Chain.</p>
          <hr />
          <h3>Dettagli Richiesta:</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Nome Azienda:</strong> ${companyName}</li>
            <li><strong>Email Contatto:</strong> ${contactEmail}</li>
            <li><strong>Settore:</strong> ${sector}</li>
            <li><strong>Wallet Address:</strong> ${walletAddress}</li>
          </ul>
          <h3>Social (Opzionali):</h3>
          <ul style="list-style-type: none; padding: 0;">
            <li><strong>Sito Web:</strong> ${socials.website || 'N/D'}</li>
            <li><strong>Facebook:</strong> ${socials.facebook || 'N/D'}</li>
            <li><strong>Instagram:</strong> ${socials.instagram || 'N/D'}</li>
            <li><strong>Twitter/X:</strong> ${socials.twitter || 'N/D'}</li>
            <li><strong>TikTok:</strong> ${socials.tiktok || 'N/D'}</li>
          </ul>
        </div>
      `,
    });

    if (error) {
      return res.status(400).json(error);
    }

    res.status(200).json({ message: "Request sent and saved successfully." });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
