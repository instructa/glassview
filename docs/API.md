# API

## Endpoints

### `GET /health`

Returns service health and stage details.

### `POST /api/screenshots`

Uploads a screenshot.

Required header:

```http
Authorization: Bearer <GLASSVIEW_UPLOAD_TOKEN>
```

Private encrypted uploads send ciphertext:

- request content type: `application/octet-stream`
- query parameters: `mode=encrypted`, `contentType=<original image type>`, `cipherAlg=AES-GCM`, `iv=<base64url-iv>`

Explicit public uploads send plaintext image bytes with `mode=public`.

Accepted original image content types:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`
- `image/svg+xml`

Optional metadata can be sent as query parameters for public uploads, or as multipart fields:

- `label`
- `sourceUrl`
- `appName`
- `viewport`
- `note`

Private successful response:

```json
{
  "id": "hex-id",
  "viewUrl": "https://example.com/v/hex-id",
  "blobUrl": "https://example.com/blob/hex-id",
  "createdAt": "2026-06-23T00:00:00.000Z"
}
```

Public successful response includes `rawUrl` instead of `blobUrl`.

### `GET /v/:id`

Opens the HTML viewer for a screenshot.

Expired or revoked links return `410 Gone`.

### `GET /blob/:id`

Returns encrypted ciphertext for private screenshots. The browser viewer decrypts it locally with the `#k=` fragment key.

Expired or revoked links return `410 Gone`.

### `GET /raw/:id`

Returns the stored image only for explicit public screenshots.

### `POST /api/screenshots/:id/revoke`

Marks a screenshot as revoked. Requires `Authorization: Bearer <GLASSVIEW_UPLOAD_TOKEN>`.

### `DELETE /api/screenshots/:id`

Alias for revocation. Requires `Authorization: Bearer <GLASSVIEW_UPLOAD_TOKEN>`.

### `GET /latest`

Redirects to the newest uploaded screenshot viewer. Public access is disabled by default; when `GLASSVIEW_ENABLE_LATEST=false`, the upload token is required.

## Limits

Uploads are limited to 10 MB.

Private reads require the full URL including fragment key to decrypt in the browser. Anyone with the full link can still view until expiry or revocation. Writes and revocation require the upload token.
