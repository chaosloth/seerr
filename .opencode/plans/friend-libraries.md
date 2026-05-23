# Friend Libraries — Feature Tasks

## Key Decisions
- **Ownership**: Global (admin-managed). Admin configures remote libraries in Settings.
- **Discovery badge**: Compact count badge ("3 friends") with tooltip listing names.
- **Fetch method**: Separate "Downloading Service" project that accepts API key + content URL.
- **First source**: Other Seerr instances (Phase 1.1).

---

## Phase 1: Remote Libraries — Configuration & Search Visibility

### Phase 1.0: Foundation

| # | Task | Status | Notes |
|---|---|---|---|
| 1.0.1 | Create `RemoteLibrary` entity (`server/entity/RemoteLibrary.ts`) | completed | |
| 1.0.2 | Create `RemoteMedia` entity (`server/entity/RemoteMedia.ts`) | completed | |
| 1.0.3 | Add `remoteLibraries: RemoteLibrarySettings[]` to AllSettings interface | cancelled | Stored as DB entities instead of settings.json |
| 1.0.4 | Create DB migrations (SQLite + Postgres) for new tables | completed | `server/migration/sqlite/1779514079354-AddRemoteLibraries.ts` + Postgres |
| 1.0.5 | Create CRUD API routes | completed | `server/routes/remotelibrary.ts` — GET/POST/PUT/DELETE + test connection (mounted at `/api/v1/remoteLibrary`) |
| 1.0.6 | Create settings UI: add/edit/delete remote library modals | completed | `src/components/Settings/SettingsRemoteLibrary.tsx` + `src/pages/settings/remotelibrary.tsx` + SettingsLayout updated |
| 1.0.7 | Update OpenAPI spec (`seerr-api.yml`) with RemoteLibrary schemas | completed | Added `RemoteLibrary` and `RemoteMedia` schemas + all CRUD paths |

### Phase 1.1: Other Seerr Instances — Searchable

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1.1 | Create `SeerrScanner` — queries remote Seerr API for availability | completed | `server/lib/scanners/seerr/index.ts`. Calls `/api/v1/media?filter=allavailable` with pagination on remote instance. |
| 1.1.2 | Add `RemoteAvailability` interface and `Media.getRemoteAvailability()` static method | completed | `server/interfaces/api/mediaInterfaces.ts` + `server/entity/Media.ts` |
| 1.1.3 | Update `MovieResult`/`TvResult` models and map functions to carry remote availability | completed | `server/models/Search.ts` |
| 1.1.4 | Update discover, search, and trending routes to include remote availability | completed | `server/routes/discover.ts` (helper `enrichWithAvailability`), `server/routes/search.ts` |
| 1.1.5 | Create "Friends" badge component (compact count + tooltip) | completed | `src/components/Common/FriendBadge.tsx` |
| 1.1.6 | Integrate FriendBadge into TitleCard | completed | `src/components/TitleCard/index.tsx` + `src/components/MediaSlider/index.tsx` |
| 1.1.7 | Add scheduled sync job for remote Seerr libraries | completed | `server/job/schedule.ts` — runs every 24h at 7:00 AM |
| 1.1.8 | Add test connection endpoint | completed | `POST /api/v1/remoteLibrary/test` — validates API key and connectivity |
| 1.1.9 | Update OpenAPI spec with RemoteAvailability schema + MovieResult/TvResult fields | completed | `seerr-api.yml` |

### Phase 1.2: Other Emby Instances

| # | Task | Status | Notes |
|---|---|---|---|
| 1.2.1 | Create `EmbyRemoteScanner` | pending | Extends or adapts JellyfinScanner for per-instance config |
| 1.2.2 | Adapt `JellyfinScanner` base to support multiple instances | pending | Currently singleton; refactor to accept instance config |
| 1.2.3 | Add test connection for Emby remote libraries | pending | Validate URL + API key |
| 1.2.4 | Scheduled sync for Emby remote libraries | pending | |

### Phase 1.3: Other Jellyfin Instances

| # | Task | Status | Notes |
|---|---|---|---|
| 1.3.1 | Reuse Emby implementation | pending | Jellyfin and Emby share the same API protocol |
| 1.3.2 | Add test connection for Jellyfin remote libraries | pending | |
| 1.3.3 | Scheduled sync for Jellyfin remote libraries | pending | |

---

## Phase 2: Remote Requests

### Phase 2.0: Downloading Service Specification

| # | Task | Status | Notes |
|---|---|---|---|
| 2.0.1 | Write API specification for Downloading Service | pending | Spec below |
| 2.0.2 | Define auth model (API key) | pending | |
| 2.0.3 | Define supported sources (Seerr, Emby, Plex, Jellyfin) | pending | |
| 2.0.4 | Define file placement contract (library folder structure) | pending | |

### Phase 2.1: Request Routing to Remote Services

| # | Task | Status | Notes |
|---|---|---|---|
| 2.1.1 | Extend `MediaRequest` entity with `remoteLibraryId` column | pending | Nullable FK to RemoteLibrary |
| 2.1.2 | Create "Request from Friend" UI in request flow | pending | Dropdown to select which friend's library to pull from |
| 2.1.3 | Add API route `POST /request/:id/send-to-remote` | pending | Triggers sending download URL to Downloading Service |
| 2.1.4 | Integrate with Downloading Service API | pending | Send authenticated request with content URL + metadata |
| 2.1.5 | Track remote request status (queued/downloading/complete/failed) | pending | New column or status field on download service side |

### Phase 2.2: Emby/Jellyfin Content Fetch

| # | Task | Status | Notes |
|---|---|---|---|
| 2.2.1 | Implement download URL generation for Emby/Jellyfin sources | pending | Construct direct download URL from Emby/Jellyfin API |
| 2.2.2 | Handle authentication for download requests | pending | Pass auth tokens/headers to Downloading Service |

---

## Downloading Service Specification

### Overview
A standalone microservice that accepts media download requests via a REST API. It authenticates with API keys, fetches media from source servers (Seerr, Plex, Emby, Jellyfin), downloads the content + metadata, and places files in the correct library directory structure.

### API Endpoints

```
POST /api/v1/download
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "source": {
    "type": "seerr" | "plex" | "emby" | "jellyfin",
    "url": "https://friend-seerr.example.com",
    "authToken": "...",
    "mediaUrl": "https://friend-seerr.example.com/media/123/download"
  },
  "destination": {
    "libraryPath": "/media/movies",
    "mediaType": "movie" | "tv",
    "title": "Movie Title",
    "year": 2024,
    "tmdbId": 123456,
    "seasonNumber": null,
    "episodeNumbers": null
  },
  "metadata": {
    "nfo": true,
    "poster": true,
    "fanart": true
  }
}
```

```
GET /api/v1/status/:downloadId
Authorization: Bearer <api-key>

Response:
{
  "id": "abc-123",
  "status": "queued" | "downloading" | "complete" | "failed",
  "progress": 45.2,
  "bytesDownloaded": 1048576000,
  "totalBytes": 2147483648,
  "error": null,
  "outputPath": "/media/movies/Movie Title (2024)/Movie Title (2024).mkv"
}
```

```
POST /api/v1/api-keys
Authorization: Bearer <master-key>

{
  "label": "Seerr Instance 1"
}

Response:
{
  "apiKey": "sk-abc123..."
}
```

### Source-Specific Authentication

| Source | Auth Method |
|---|---|
| Seerr | `X-Api-Key` header |
| Plex | `X-Plex-Token` header |
| Emby | `X-Emby-Token` header or `api_key` query param |
| Jellyfin | `X-Emby-Token` header or `api_key` query param |

### File Placement Convention

```
/library/movies/Movie Title (Year)/
  Movie Title (Year).mkv
  Movie Title (Year).nfo
  poster.jpg
  fanart.jpg
  Movie Title (Year)-thumb.jpg

/library/tv/Show Title/
  Show Title.nfo
  poster.jpg
  fanart.jpg
  Season 01/
    Show Title - S01E01.mkv
    Show Title - S01E01-thumb.jpg
    Show Title - S01E01.nfo
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `API_KEY` | Master API key for managing download keys |
| `PORT` | Listen port (default: 5056) |
| `LIBRARY_BASE_PATH` | Root directory for media libraries |
| `TEMP_DIR` | Temporary download directory |
| `MAX_CONCURRENT_DOWNLOADS` | Max parallel downloads (default: 2) |

---

## Current Progress

**Status**: Planning complete. Ready to begin Phase 1.0 implementation.
