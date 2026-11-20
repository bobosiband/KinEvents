# Cloudinary photos and per-event albums

## Goal

Every event has an album. Members upload straight from their phone's camera roll. The backend never receives the bytes — only the Cloudinary URL and metadata.

## Data model

New collection `albums`:

```ts
interface IAlbum {
  id: string
  eventId: string
  title: string
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}
```

New collection `photos`:

```ts
interface IPhoto {
  id: string
  albumId: string
  uploaderId: string
  cloudinaryPublicId: string
  secureUrl: string
  thumbnailUrl: string
  width: number
  height: number
  takenAt?: string              // from EXIF
  caption?: string
  createdAt: string
  deletedAt?: string
}
```

## Upload flow

1. Frontend calls `POST /api/photos/upload-token` with `{ albumId }`.
2. Backend issues a short-lived Cloudinary signed upload signature scoped to the album's folder (`kinevents/albums/<albumId>/`).
3. Frontend uploads directly to Cloudinary from the browser.
4. Cloudinary webhook `POST /api/photos/webhook` writes the `IPhoto` row.

## Endpoints

| Method | Path | Who |
| ------ | ---- | --- |
| `POST /api/albums` | create | admin / manager / event creator |
| `GET /api/albums/:id` | list photos | approved users |
| `POST /api/photos/upload-token` | signed upload | approved users (members can upload to any album they can see) |
| `DELETE /api/photos/:id` | soft-delete | uploader, admin, manager |

## Admin controls

- Delete photos (soft-delete, hard-delete happens via SoftDeletePurgeJob).
- Block a user from uploading.

## Verdict

**Integration** into the main backend. Direct-to-Cloudinary uploads mean no bandwidth hits the API, so there's no cold-start case for isolating the upload path. Cloudinary credentials sit next to the existing env vars.
