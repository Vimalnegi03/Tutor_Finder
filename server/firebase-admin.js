// firebase-admin.mjs
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Load service account from JSON file
const serviceAccount = JSON.parse(
  await readFile(new URL('./serviceAccountKey.json', import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'sample-firebase-ai-app-d7f47.appspot.com'
});

export const bucket = admin.storage().bucket();