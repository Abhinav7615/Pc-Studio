import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File, Files, Fields } from 'formidable';
import fs from 'fs';
import { Db, GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import mediaConnection from '@/lib/mongodbMedia';
import { uploadMediaWithMetadata } from '@/lib/mediaStorage';

export const config = {
  api: {
    bodyParser: false
  }
};

function getFormField(fields: Fields, key: string): string | undefined {
  const value = fields[key];
  if (Array.isArray(value)) return value[0] as string | undefined;
  return value as string | undefined;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields: Fields, files: Files) => {
    if (err) {
      console.error('Form parse error', err);
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    const incomingFile = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!incomingFile || Array.isArray(incomingFile)) {
      return res.status(400).json({ error: 'file field required' });
    }

    const file = incomingFile as File;

    try {
      const db = (mediaConnection?.db ?? mongoose.connection.db) as Db | undefined;
      if (!db) {
        console.error('MongoDB connection unavailable');
        return res.status(500).json({ error: 'MongoDB connection unavailable' });
      }

      const bucket = new GridFSBucket(db);
      const filePath = file.filepath || (file as unknown as { path?: string }).path;
      if (!filePath) {
        console.error('Uploaded file path unavailable');
        return res.status(500).json({ error: 'Uploaded file path unavailable' });
      }
      const readStream = fs.createReadStream(filePath);
      const uploadStream = bucket.openUploadStream(file.originalFilename || file.newFilename || 'upload');

      readStream.pipe(uploadStream)
        .on('error', (streamError: Error) => {
          console.error('GridFS upload error', streamError);
          return res.status(500).json({ error: 'Failed to upload file' });
        })
        .on('finish', async () => {
          try {
            const fileId = uploadStream.id as mongoose.Types.ObjectId;
            const uploadedBy = getFormField(fields, 'uploadedBy') || new mongoose.Types.ObjectId().toString();

            const metadata = await uploadMediaWithMetadata(
              fileId.toString(),
              file.originalFilename || file.newFilename || 'upload',
              file.size || 0,
              file.mimetype || 'application/octet-stream',
              getFormField(fields, 'category') || 'other',
              getFormField(fields, 'purpose') || 'other',
              {},
              uploadedBy
            );

            return res.status(200).json({ success: true, fileId, metadataId: metadata._id });
          } catch (metadataError) {
            console.error('Metadata creation error', metadataError);
            return res.status(500).json({ error: 'Failed to create metadata' });
          }
        });
    } catch (error) {
      console.error('Upload handler error', error);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}
