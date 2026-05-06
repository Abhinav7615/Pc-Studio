import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase admin credentials are not configured. Firebase token verification may fail.');
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export async function verifyFirebaseIdToken(idToken: string) {
  if (!admin.apps.length) {
    throw new Error('Firebase admin is not initialized. Check FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID.');
  }
  return admin.auth().verifyIdToken(idToken);
}
