import JellyfinAPI from '@server/api/jellyfin';
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
import logger from '@server/logger';

type EmbyJellyfinSyncStatus = StatusBase & {
  currentLibrary: RemoteLibrary | null;
  libraries: RemoteLibrary[];
};

class EmbyJellyfinScanner implements RunnableScanner<EmbyJellyfinSyncStatus> {
  private running = false;
  private progress = 0;
  private total = 0;
  private currentLibrary: RemoteLibrary | null = null;
  private libraries: RemoteLibrary[] = [];

  public status(): EmbyJellyfinSyncStatus {
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
      where: [
        { type: RemoteLibraryType.EMBY, isEnabled: true, syncEnabled: true },
        {
          type: RemoteLibraryType.JELLYFIN,
          isEnabled: true,
          syncEnabled: true,
        },
      ],
    });

    if (this.libraries.length === 0) {
      logger.info('No enabled Emby/Jellyfin remote libraries to scan', {
        label: 'Emby/Jellyfin Scanner',
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

    logger.info('Emby/Jellyfin remote library scan complete', {
      label: 'Emby/Jellyfin Scanner',
    });
  }

  private buildUrl(library: RemoteLibrary): string {
    const protocol = library.useSsl ? 'https' : 'http';
    const base = library.baseUrl
      ? `/${library.baseUrl.replace(/^\/|\/$/g, '')}`
      : '';
    return `${protocol}://${library.hostname}:${library.port}${base}`;
  }

  private async scanLibrary(library: RemoteLibrary): Promise<void> {
    this.currentLibrary = library;
    const remoteMediaRepository = getRepository(RemoteMedia);
    const mediaRepository = getRepository(Media);

    const url = this.buildUrl(library);

    logger.info(`Scanning remote Emby/Jellyfin library: ${library.name}`, {
      label: 'Emby/Jellyfin Scanner',
    });

    const seenIds: Set<number> = new Set();

    try {
      const api = new JellyfinAPI(url, library.apiKey ?? '');

      const libraries = await api.getLibraries();

      if (!libraries || libraries.length === 0) {
        logger.warn(
          `No libraries found on remote Emby/Jellyfin server: ${library.name}`,
          { label: 'Emby/Jellyfin Scanner' }
        );
        return;
      }

      for (const lib of libraries) {
        try {
          const items = await api.getLibraryContents(lib.key);

          if (!items || items.length === 0) {
            continue;
          }

          this.total += items.length;

          for (const item of items) {
            try {
              const metadata = await api.getItemData(item.Id);

              if (!metadata?.ProviderIds) {
                continue;
              }

              const tmdbId =
                Number(metadata.ProviderIds.Tmdb) ||
                Number(metadata.ProviderIds.TheMovieDb) ||
                null;

              if (!tmdbId) {
                continue;
              }

              const mediaType =
                item.Type === 'Movie' ? MediaType.MOVIE : MediaType.TV;

              const localMedia = await mediaRepository.findOne({
                where: { tmdbId, mediaType },
                select: { id: true },
              });

              const resolvedMedia =
                localMedia ??
                mediaRepository.create({
                  tmdbId,
                  mediaType,
                  status: 5,
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
                  remoteId: metadata.Id,
                });
              } else {
                remoteMedia.status = 5;
                remoteMedia.remoteId = metadata.Id;
              }

              await remoteMediaRepository.save(remoteMedia);
              seenIds.add(remoteMedia.id);

              this.progress++;
            } catch {
              // Skip individual item failures
            }
          }
        } catch {
          logger.warn(
            `Failed to scan library contents: ${lib.title} on ${library.name}`,
            { label: 'Emby/Jellyfin Scanner' }
          );
        }
      }
    } catch (e) {
      logger.error(
        `Failed to scan remote Emby/Jellyfin library: ${library.name}`,
        {
          label: 'Emby/Jellyfin Scanner',
          errorMessage: (e as Error).message,
        }
      );
    }

    // Clean up stale entries
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
      `Completed scanning Emby/Jellyfin library: ${library.name} (${seenIds.size} items)`,
      { label: 'Emby/Jellyfin Scanner' }
    );
  }
}

export const embyJellyfinScanner = new EmbyJellyfinScanner();
