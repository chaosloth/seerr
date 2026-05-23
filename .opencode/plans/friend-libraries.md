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
| 1.2.1 | Create `EmbyRemoteScanner` | completed | Unified EmbyJellyfinScanner in `server/lib/scanners/emby-jellyfin/` |
| 1.2.2 | Adapt `JellyfinScanner` base to support multiple instances | completed | Per-instance JellyfinAPI with configurable deviceId |
| 1.2.3 | Add test connection for Emby remote libraries | completed | MediaBrowser auth header with deviceId support |
| 1.2.4 | Scheduled sync for Emby remote libraries | completed | Remote Library Scan job runs embyJellyfinScanner |

### Phase 1.3: Other Jellyfin Instances

| # | Task | Status | Notes |
|---|---|---|---|
| 1.3.1 | Reuse Emby implementation | completed | Jellyfin and Emby share the same API protocol |
| 1.3.2 | Add test connection for Jellyfin remote libraries | completed | Same endpoint as Emby |
| 1.3.3 | Scheduled sync for Jellyfin remote libraries | completed | Same scanner, filtered by type |

### Phase 1.4: Other Plex Instances

| # | Task | Status | Notes |
|---|---|---|---|
| 1.4.1 | Create `RemotePlexScanner` | completed | `server/lib/scanners/remote-plex/index.ts`. Creates PlexAPI per-instance, paginates through library sections, extracts TMDB IDs from GUIDs (modern plex:// agent with Guid array + legacy imdb:///tmdb:///tvdb:// agents) |
| 1.4.2 | Add test connection for Plex remote libraries | completed | `X-Plex-Token` header, GET `/` |
| 1.4.3 | Scheduled sync for Plex remote libraries | completed | Remote Library Scan job runs remotePlexScanner |

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

### Phase 2.2: Seerr Content Fetch

| # | Task | Status | Notes |
|---|---|---|---|
| 2.2.1 | Implement download URL generation for Seerr sources | delegated | Handled by Friendarr: `GET {baseUrl}/api/v1/media/{id}/download` with X-Api-Key |
| 2.2.2 | Handle authentication for Seerr download requests | delegated | Friendarr passes X-Api-Key from library config |

### Phase 2.3: Emby/Jellyfin Content Fetch

| # | Task | Status | Notes |
|---|---|---|---|
| 2.3.1 | Implement download URL generation for Emby/Jellyfin sources | delegated | Handled by Friendarr: `GET {baseUrl}/Items/{id}/Download` with MediaBrowser auth |
| 2.3.2 | Handle authentication for download requests | delegated | Friendarr passes deviceId and token from library config |

### Phase 2.4: Plex Content Fetch

| # | Task | Status | Notes |
|---|---|---|---|
| 2.4.1 | Implement download URL generation for Plex sources | delegated | Handled by Friendarr: 2-step resolve parts → download, multi-part concat |
| 2.4.2 | Resolve media parts from ratingKey for downloading | delegated | Friendarr handles `/library/metadata/{key}?includeMedia=1` |
| 2.4.3 | Handle authentication for Plex download requests | delegated | Friendarr passes X-Plex-Token from library config |

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
    "deviceId": "Seerr-script",
    "mediaId": "123",
    "ratingKey": "456",
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

### Source-Specific Download URLs

Each source type provides a different mechanism for downloading the actual media file:

**Seerr**: Uses the Seerr media download endpoint.
```
GET {baseUrl}/api/v1/media/{mediaId}/download
Authorization: X-Api-Key {apiKey}
```

**Emby/Jellyfin**: Uses the Items endpoint to get the direct stream/download URL.
```
GET {baseUrl}/Items/{itemId}/Download
Authorization: MediaBrowser Client="Seerr", Device="Seerr", DeviceId="{deviceId}", Version="1.0.0", Token="{apiKey}"
```

**Plex**: Resolves the media part key from the item metadata, then downloads the raw file.
```
# Step 1: Get item metadata with media parts
GET {baseUrl}/library/metadata/{ratingKey}?includeMedia=1
X-Plex-Token: {plexToken}

# Response includes Media[].Part[] objects with a 'key' path

# Step 2: Download the file directly
GET {baseUrl}{partKey}?download=1
X-Plex-Token: {plexToken}
```
The Plex part key is a path like `/library/parts/12345/file.mkv`. The Downloading Service must append `?download=1` to force a file download rather than a stream.

For multi-part files (multiple video files per item), the service should concatenate all parts in order.

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

**Status**: Phase 1 complete (all four source types discoverable). Phase 2 Seerr-side complete (entity, routes, UI, handoff). Phases 2.2-2.4 delegated to Friendarr — the standalone Downloading Service at `/Users/cc/Development/friendarr`.
