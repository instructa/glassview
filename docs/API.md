# API

## Endpoints

### `GET /health`

Returns service health and stage details.

### `POST /api/screenshots`

Uploads an image.

Required header:

```http
Authorization: Bearer <GLASSVIEW_UPLOAD_TOKEN>
```

Accepted content types:

- `image/png`
- `image/jpeg`
- `image/webp`
- `image/gif`
- `image/svg+xml`

Optional metadata can be sent as query parameters for raw image uploads, or as multipart fields:

- `label`
- `sourceUrl`
- `appName`
- `viewport`
- `note`

Successful response:

```json
{
  "id": "hex-id",
  "viewUrl": "https://example.com/v/hex-id",
  "rawUrl": "https://example.com/raw/hex-id",
  "createdAt": "2026-06-23T00:00:00.000Z"
}
```

### `GET /v/:id`

Opens the HTML viewer for a screenshot.

### `GET /raw/:id`

Returns the stored image.

### `GET /latest`

Redirects to the newest uploaded screenshot viewer.

## Limits

Uploads are limited to 10 MB.

Reads are public by URL. Writes require the upload token.
