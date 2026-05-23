import type { MediaType } from '@server/constants/media';
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
import axios from 'axios';

type RemoteLibrarySyncStatus = StatusBase & {
  currentLibrary: RemoteLibrary | null;
  libraries: RemoteLibrary[];
};

class SeerrScanner implements RunnableScanner<RemoteLibrarySyncStatus> {
  private running = false;
  private progress = 0;
  private total = 0;
  private currentLibrary: RemoteLibrary | null = null;
  private libraries: RemoteLibrary[] = [];

  public status(): RemoteLibrarySyncStatus {
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
        type: RemoteLibraryType.SEERR,
        isEnabled: true,
        syncEnabled: true,
      },
    });

    if (this.libraries.length === 0) {
      logger.info('No enabled Seerr remote libraries to scan', {
        label: 'Seerr Scanner',
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

    logger.info('Seerr remote library scan complete', {
      label: 'Seerr Scanner',
    });
  }

  private buildUrl(library: RemoteLibrary) {
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

    const baseUrl = this.buildUrl(library);
    const headers: Record<string, string> = library.apiKey
      ? { 'X-Api-Key': library.apiKey }
      : {};

    logger.info(`Scanning remote Seerr library: ${library.name}`, {
      label: 'Seerr Scanner',
    });

    const seenIds: Set<number> = new Set();

    try {
      let page = 0;
      const pageSize = 50;
      let hasMore = true;

      while (hasMore) {
        const skip = page * pageSize;

        const response = await axios.get<{
          pageInfo: { pages: number; page: number; results: number };
          results: { id: number; tmdbId: number; mediaType: string }[];
        }>(`${baseUrl}/api/v1/media`, {
          headers,
          params: {
            filter: 'allavailable',
            take: pageSize,
            skip,
          },
          timeout: 30000,
        });

        const { results, pageInfo } = response.data;

        if (!results || results.length === 0) {
          hasMore = false;
          break;
        }

        for (const remoteItem of results) {
          let localMedia = await mediaRepository.findOne({
            where: {
              tmdbId: remoteItem.tmdbId,
              mediaType: remoteItem.mediaType as MediaType,
            },
            select: { id: true },
          });

          if (!localMedia) {
            localMedia = mediaRepository.create({
              tmdbId: remoteItem.tmdbId,
              mediaType: remoteItem.mediaType as MediaType,
              status: 5,
            });
            await mediaRepository.save(localMedia);
          }

          let remoteMedia = await remoteMediaRepository.findOne({
            where: {
              media: { id: localMedia.id },
              remoteLibrary: { id: library.id },
            },
          });

          if (!remoteMedia) {
            remoteMedia = remoteMediaRepository.create({
              media: { id: localMedia.id } as Media,
              remoteLibrary: library,
              status: 5,
              remoteId: String(remoteItem.id),
            });
          } else {
            remoteMedia.status = 5;
            remoteMedia.remoteId = String(remoteItem.id);
          }

          await remoteMediaRepository.save(remoteMedia);
          seenIds.add(remoteMedia.id);
        }

        this.progress = skip + results.length;
        this.total = pageInfo.results;

        if (skip + results.length >= pageInfo.results) {
          hasMore = false;
        }

        page++;
      }
    } catch (e) {
      logger.error(`Failed to scan remote Seerr library: ${library.name}`, {
        label: 'Seerr Scanner',
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
      `Completed scanning Seerr library: ${library.name} (${seenIds.size} items)`,
      { label: 'Seerr Scanner' }
    );
  }
}

export const seerrScanner = new SeerrScanner();
