import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';
import webpush from 'web-push';
import { initializeApp } from 'firebase-admin/app';
import admin from 'firebase-admin';

const vapidPublic = process.env.WEB_PUSH_VAPID_PUBLIC;
const vapidPrivate = process.env.WEB_PUSH_VAPID_PRIVATE;

if (vapidPublic && vapidPrivate) {
  try {
    webpush.setVapidDetails(`mailto:${process.env.WEB_PUSH_CONTACT || 'no-reply@example.com'}`, vapidPublic, vapidPrivate);
  } catch (e) {
    console.error('web-push init error', e);
  }
}

// Initialize firebase admin if service account is configured
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (e) {
    console.error('Firebase admin init error', e);
  }
}

export async function sendPushToUser(userId: string | null, payload: { title: string; body: string; data?: Record<string, unknown> }) {
  await dbConnect();
  if (!userId) return;

  try {
    const devices = await Device.find({ user: userId }).lean();
    const promises: Promise<unknown>[] = [];

    for (const device of devices) {
      if (device.webPushSubscription && vapidPublic && vapidPrivate) {
        const pushPayload = JSON.stringify({ title: payload.title, body: payload.body, data: payload.data || {} });
        promises.push(
          webpush.sendNotification(device.webPushSubscription, pushPayload).catch((err: unknown) => {
            console.error('Web push send failed', err);
            return null;
          }),
        );
      }

      if (device.fcmToken && admin.apps.length) {
        const message: admin.messaging.Message = {
          token: device.fcmToken,
          notification: { title: payload.title, body: payload.body },
          data: Object.fromEntries(Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])),
        };
        promises.push(
          admin
            .messaging()
            .send(message)
            .catch((err: unknown) => {
              console.error('FCM send failed', err);
              return null;
            }),
        );
      }
    }

    await Promise.all(promises);
  } catch (error) {
    console.error('sendPushToUser error:', error);
  }
}
