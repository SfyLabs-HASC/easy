// File: /api/upload.js (Versione Definitiva con logica PUT + HEAD)

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { formidable } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3Client = new S3Client({
  endpoint: "https://s3.filebase.com",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.VITE_FILEBASE_ACCESS_KEY,
    secretAccessKey: process.env.VITE_FILEBASE_SECRET_KEY,
  },
});

const BUCKET_NAME = process.env.VITE_FILEBASE_BUCKET_NAME;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form data.' });
    }

    try {
      const file = files.file[0];
      const companyName = fields.companyName[0] || 'AziendaGenerica';
      const objectKey = `${companyName}/${Date.now()}_${file.originalFilename}`;
      const fileContent = fs.readFileSync(file.filepath);

      // --- FASE 1: UPLOAD DEL FILE (PUT) ---
      const putCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: fileContent,
        ContentType: file.mimetype,
      });
      await s3Client.send(putCommand);

      // --- FASE 2: RICHIESTA DEI METADATI (HEAD) ---
      // Ora che il file è caricato, chiediamo a Filebase le sue informazioni.
      const headCommand = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
      });
      const headResult = await s3Client.send(headCommand);

      // La risposta a HEAD conterrà i metadati che cerchiamo.
      const cid = headResult.Metadata?.cid;

      if (!cid) {
        console.error("CID non trovato nei Metadata della richiesta HEAD. Risposta HEAD:", headResult);
        // Se anche qui non c'è, usiamo l'ETag come ultimissima risorsa.
        const fallbackId = headResult.ETag?.replace(/"/g, "");
        return res.status(200).json({ cid: fallbackId });
      }

      // Restituiamo il CID corretto al browser!
      return res.status(200).json({ cid });

    } catch (error) {
      console.error('Upload/Head Error:', error);
      return res.status(500).json({ error: 'File upload failed.', details: error.message });
    }
  });
}