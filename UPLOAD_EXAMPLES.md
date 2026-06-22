# Media Upload Examples

Simple examples for calling the upload API at `/api/media/upload`.

JSON body fields:
- `fileBase64` (string, base64 of file contents)
- `fileName` (string)
- `contentType` (string, e.g. `image/png`)
- `category` (optional)
- `purpose` (optional)
- `linkedTo` (optional object)

cURL example (base64 inline):

```bash
FILE_PATH=./example.png
BASE64=$(base64 -w 0 $FILE_PATH)
curl -X POST https://your-site.com/api/media/upload \
  -H "Content-Type: application/json" \
  -d '{"fileBase64":"'$BASE64'","fileName":"example.png","contentType":"image/png"}'
```

Multipart/form-data curl example (recommended for large files):

```bash
curl -X POST https://your-site.com/api/media/uploadMultipart \
  -F "file=@./example.png" \
  -F "category=payment" \
  -F "purpose=payment_screenshot" \
  -F "uploadedBy=USER_ID"
```

Node fetch example:

```js
const fs = require('fs');
const fetch = require('node-fetch');
const file = fs.readFileSync('./example.png');
const base64 = file.toString('base64');

await fetch('https://your-site.com/api/media/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileBase64: base64, fileName: 'example.png', contentType: 'image/png' })
});
```

Note: For production, prefer multipart/form-data streaming uploads directly to GridFS or S3-compatible storage and only send metadata to the API.
