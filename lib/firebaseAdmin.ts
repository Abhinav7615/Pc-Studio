import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const hasServiceAccount = Boolean(projectId && clientEmail && privateKey);

if (!admin.apps.length) {
  if (!hasServiceAccount) {
    // Firebase admin is not configured in this environment, proceed with public key verification when needed.
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export async function verifyFirebaseIdToken(idToken: string) {
  if (admin.apps.length) {
    return admin.auth().verifyIdToken(idToken);
  }

  if (!projectId) {
    throw new Error('Firebase project ID is not configured. Set FIREBASE_PROJECT_ID.');
  }

  const publicKeysUrl = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
  const publicKeysResponse = await fetch(publicKeysUrl);
  if (!publicKeysResponse.ok) {
    throw new Error('Unable to fetch Firebase public keys');
  }

  const publicKeys = (await publicKeysResponse.json()) as Record<string, string>;
  const decodedHeader = jwt.decode(idToken, { complete: true }) as { header?: { kid?: string } } | null;
  const kid = decodedHeader?.header?.kid;
  if (!kid) {
    throw new Error('Invalid Firebase token header');
  }

  const publicKey = publicKeys[kid];
  if (!publicKey) {
    throw new Error('Firebase public key not found for token');
  }

  const verified = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  return verified as any;
}
