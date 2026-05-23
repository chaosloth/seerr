import PlexAPI from '@server/api/plexapi';
import TheMovieDb from '@server/api/themoviedb';
import { MediaType } from '@server/constants/media';
import { RemoteLibraryType } from '@server/constants/server';
import { getRepository } from '@server/datasource';
import Media from '@server/entity/Media';
import { RemoteLibrary } from '@server/entity/RemoteLibrary';
import { RemoteMedia } from '@server/entity/RemoteMedia';
import type {
  RunnableScanner,
  StatusBase,
} from '@server/lib/scanners/baseScanner';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';

const imdbRegex = new RegExp(/imdb:\/\/(tt[0-9]+)/);
const tmdbRegex = new RegExp(/tmdb:\/\/([0-9]+)/);
const tvdbRegex = new RegExp(/tvdb:\/\/([0-9]+)/);
const tmdbShowRegex = new RegExp(/themoviedb:\/\/([0-9]+)/);
const plexRegex = new RegExp(/plex:\/\//);

type RemotePlexSyncStatus = StatusBase & {
  currentLibrary: RemoteLibrary | null;
  libraries: RemoteLibrary[];
};

class RemotePlexScanner implements RunnableScanner<RemotePlexSyncStatus> {
  private running = false;
  private progress = 0;
  private total = 0;
  private currentLibrary: RemoteLibrary | null = null;
  private libraries: RemoteLibrary[] = [];
  private readonly tmdb = new TheMovieDb();

  public status(): RemotePlexSyncStatus {
    return {
      running: this.running,
      progress: this.progress,
      total: this.total,
      currentLibrary: this.currentLibrary,
      libraries: this.libraries,
    };
  }

  public async run(): Promise<void> {
    const libraryRepository = getRepository(RemoteLibrary);

    this.libraries = await libraryRepository.find({
      where: {
        type: RemoteLibraryType.PLEX,
        isEnabled: true,
        syncEnabled: true,
      },
    });

    if (this.libraries.length === 0) {
      logger.info('No enabled Plex remote libraries to scan', {
        label: 'Plex Scanner',
      });
      return;
    }

    this.running = true;

    try {
      for (const library of this.libraries) {
        await this.scanLibrary(library);
      }
    } finally {
      this.running = false;
    }

    logger.info('Plex remote library scan complete', {
      label: 'Plex Scanner',
    });
  }

  private async scanLibrary(library: RemoteLibrary): Promise<void> {
    this.currentLibrary = library;
    const remoteMediaRepository = getRepository(RemoteMedia);
    const mediaRepository = getRepository(Media);
    const settings = getSettings();

    logger.info(`Scanning remote Plex library: ${library.name}`, {
      label: 'Plex Scanner',
    });

    const seenIds: Set<number> = new Set();

    try {
      const api = new PlexAPI({
        plexToken: library.plexToken,
        plexSettings: {
          name: library.name,
          ip: library.hostname,
          port: library.port,
          useSsl: library.useSsl,
          libraries: [],
          machineId: settings.plex.machineId,
        },
      });

      const sections = await api.getLibraries();

      const mediaSections = sections.filter(
        (s) => s.type === 'movie' || s.type === 'show'
      );

      if (mediaSections.length === 0) {
        logger.warn(
          `No movie/show libraries found on remote Plex server: ${library.name}`,
          { label: 'Plex Scanner' }
        );
        return;
      }

      for (const section of mediaSections) {
        const mediaType =
          section.type === 'movie' ? MediaType.MOVIE : MediaType.TV;

        try {
          let offset = 0;
          const pageSize = 50;

          while (true) {
            const { totalSize, items } = await api.getLibraryContents(
              section.key,
              { offset, size: pageSize }
            );

            if (!items || items.length === 0) {
              break;
            }

            this.total = Math.max(this.total, totalSize);

            for (const item of items) {
              try {
                const tmdbId = await this.extractTmdbId(api, item);

                if (!tmdbId) {
                  continue;
                }

                const localMedia = await mediaRepository.findOne({
                  where: { tmdbId, mediaType },
                  select: { id: true },
                });

                const resolvedMedia =
                  localMedia ??
                  mediaRepository.create({
                    tmdbId,
                    mediaType,
                    status: 1,
                  });

                if (!localMedia) {
                  await mediaRepository.save(resolvedMedia);
                }

                let remoteMedia = await remoteMediaRepository.findOne({
                  where: {
                    media: { id: resolvedMedia.id },
                    remoteLibrary: { id: library.id },
                  },
                });

                if (!remoteMedia) {
                  remoteMedia = remoteMediaRepository.create({
                    media: { id: resolvedMedia.id } as Media,
                    remoteLibrary: library,
                    status: 5,
                    remoteId: item.ratingKey,
                  });
                } else {
                  remoteMedia.status = 5;
                  remoteMedia.remoteId = item.ratingKey;
                }

                await remoteMediaRepository.save(remoteMedia);
                seenIds.add(remoteMedia.id);
              } catch {
                // Skip individual item failures
              }

              this.progress++;
            }

            if (items.length < pageSize) {
              break;
            }

            offset += pageSize;
          }
        } catch {
          logger.warn(
            `Failed to scan section ${section.title} on ${library.name}`,
            { label: 'Plex Scanner' }
          );
        }
      }
    } catch (e) {
      logger.error(`Failed to scan remote Plex library: ${library.name}`, {
        label: 'Plex Scanner',
        errorMessage: (e as Error).message,
      });
    }

    if (seenIds.size > 0) {
      await remoteMediaRepository
        .createQueryBuilder()
        .delete()
        .from(RemoteMedia)
        .where('remoteLibraryId = :libraryId', { libraryId: library.id })
        .andWhere('id NOT IN (:...ids)', { ids: [...seenIds] })
        .execute();
    }

    await getRepository(RemoteLibrary).update(library.id, {
      lastSyncAt: new Date(),
    });

    logger.info(
      `Completed scanning Plex library: ${library.name} (${seenIds.size} items)`,
      { label: 'Plex Scanner' }
    );
  }

  private async extractTmdbId(
    api: PlexAPI,
    item: { ratingKey: string; guid: string; Guid?: { id: string }[] }
  ): Promise<number | null> {
    // Modern Plex agent: plex:// GUIDs with Guid array
    if (item.guid.match(plexRegex)) {
      const guidList = item.Guid && item.Guid.length > 0 ? item.Guid : null;
      const metadata = guidList
        ? { Guid: item.Guid! }
        : await api.getMetadata(item.ratingKey).catch(() => null);

      if (metadata?.Guid) {
        for (const ref of metadata.Guid) {
          if (ref.id.match(tmdbRegex)) {
            const match = ref.id.match(tmdbRegex);
            if (match) {
              return Number(match[1]);
            }
          } else if (ref.id.match(imdbRegex)) {
            const match = ref.id.match(imdbRegex);
            if (match) {
              try {
                const tmdbMedia = await this.tmdb.getMediaByImdbId({
                  imdbId: match[1],
                });
                return tmdbMedia.id;
              } catch {
                // Continue to next ref
              }
            }
          }
        }
      }
      return null;
    }

    // Legacy TMDB agent
    if (item.guid.match(tmdbRegex)) {
      const match = item.guid.match(tmdbRegex);
      if (match) {
        return Number(match[1]);
      }
    }

    // Legacy themoviedb agent (shows)
    if (item.guid.match(tmdbShowRegex)) {
      const match = item.guid.match(tmdbShowRegex);
      if (match) {
        return Number(match[1]);
      }
    }

    // Legacy IMDb agent
    if (item.guid.match(imdbRegex)) {
      const match = item.guid.match(imdbRegex);
      if (match) {
        try {
          const tmdbMedia = await this.tmdb.getMediaByImdbId({
            imdbId: match[1],
          });
          return tmdbMedia.id;
        } catch {
          return null;
        }
      }
    }

    // Legacy TVDB agent
    if (item.guid.match(tvdbRegex)) {
      const match = item.guid.match(tvdbRegex);
      if (match) {
        try {
          const show = await this.tmdb.getShowByTvdbId({
            tvdbId: Number(match[1]),
          });
          return show.id;
        } catch {
          return null;
        }
      }
    }

    return null;
  }
}

export const remotePlexScanner = new RemotePlexScanner();
