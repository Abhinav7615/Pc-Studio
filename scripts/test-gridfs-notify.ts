import fs from 'fs';
import dbConnect from '../lib/mongodb';
import { uploadBufferToGridFS } from '../lib/mediaGridFS';
import { notifyAdminsPaymentProof } from '../telegramBot/helpers';

(async () => {
  try {
    const buf = fs.readFileSync('public/screenshot-540x720.png');
    await dbConnect();
    const filename = `${Date.now()}-test.png`;
    console.log('uploading as', filename);
    const id = await uploadBufferToGridFS(buf, filename, 'image/png');
    console.log('uploaded id', String(id));
    const order = {
      _id: 'gridfs-test-1',
      orderNumber: 'GRIDFS-1',
      shipping: { name: 'GridFS Test' },
      total: 10,
      paymentMethod: 'manual',
      paymentScreenshot: `/api/upload?file=${encodeURIComponent(filename)}`,
      createdAt: new Date(),
    } as any;
    await notifyAdminsPaymentProof(order);
    console.log('notify done');
  } catch (e) {
    console.error('test failed', e);
    process.exit(1);
  }
})();
