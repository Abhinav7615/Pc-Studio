# Adding a Second (Media) MongoDB Cluster

This project now supports two MongoDB clusters:

- Primary app data: `MONGODB_URI` (existing cluster)
- Media data (images, videos, user-uploaded screenshots): `MONGODB_MEDIA_URI` (new cluster)

Follow these steps to add a free media cluster and wire it into the app.

1. Create a free MongoDB Atlas cluster
   - Sign in to https://cloud.mongodb.com and create a new free (M0) cluster.
   - Choose a region near your users.
   - Whitelist your IP (or allow access from anywhere for initial testing).
   - Create a database user with a password.

2. Create a connection string
   - In the Atlas UI, choose "Connect" → "Connect your application" and copy the connection string.
   - It will look like:
     mongodb+srv://<username>:<password>@cluster0.abcd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
   - Replace `<username>` and `<password>` with the user you created.
   - Set the default DB to a name like `pc_studio_media`.

3. Set environment variable
   - Add the connection string to your environment variables as `MONGODB_MEDIA_URI`.
   - Example `.env.local` entries:

```
MONGODB_URI=mongodb+srv://appuser:appPass@cluster0.xyz.mongodb.net/pcstudio
MONGODB_MEDIA_URI=mongodb+srv://mediauser:mediaPass@cluster1.abc.mongodb.net/pc_studio_media
```

4. Indexes and GridFS
   - Media files (binary) are best stored in GridFS on the media cluster.
   - The code will automatically create a `GridFSBucket` using the media connection when deleting files permanently.
   - Ensure the media cluster has sufficient storage and that you monitor usage.

5. Migration (optional)
   - If you already have media in the primary cluster, export and import to the new cluster using `mongodump`/`mongorestore` or `mongoexport`/`mongoimport` and transfer GridFS files via `mongofiles`.
   - You can also use the built-in migration helper script:
     ```bash
     node scripts/migrate-media-cluster.js --dry-run
     ```
     Then run:
     ```bash
     node scripts/migrate-media-cluster.js
     ```
   - If your URIs do not include DB names, also set:
     ```env
     MONGODB_DB_NAME=pcstudio
     MONGODB_MEDIA_DB_NAME=pc_studio_media
     ```

6. Local development
   - For local dev you can leave `MONGODB_MEDIA_URI` empty — the code will fall back to the primary connection or use an in-memory DB for tests.

7. Permissions and security
   - Use separate DB users for app and media clusters.
   - Restrict network access and rotate credentials regularly.

8. Verify
   - Start the app and check logs: `Connected to media MongoDB` message should appear if `MONGODB_MEDIA_URI` is set.
   - Upload a media file and ensure `MediaMetadata` documents are stored in the `pc_studio_media` database.

If you want, I can:
- Add GridFS upload helpers that write file streams to the media cluster
- Add migration scripts to move existing GridFS data to the media cluster
- Add monitoring/cleanup alerts for the media cluster

Tell me which of the above you'd like me to implement next.