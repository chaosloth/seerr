import { RemoteLibraryType } from '@server/constants/server';
import { getRepository } from '@server/datasource';
import { RemoteLibrary } from '@server/entity/RemoteLibrary';
import { Permission } from '@server/lib/permissions';
import { embyJellyfinScanner } from '@server/lib/scanners/emby-jellyfin';
import { seerrScanner } from '@server/lib/scanners/seerr';
import logger from '@server/logger';
import { isAuthenticated } from '@server/middleware/auth';
import axios from 'axios';
import { Router } from 'express';

const remoteLibraryRoutes = Router();

remoteLibraryRoutes.use(isAuthenticated(Permission.ADMIN));

remoteLibraryRoutes.get('/', async (_req, res) => {
  const repository = getRepository(RemoteLibrary);

  const libraries = await repository.find({
    order: { name: 'ASC' },
  });

  return res.status(200).json(libraries);
});

remoteLibraryRoutes.post<
  undefined,
  RemoteLibrary,
  {
    name: string;
    type: RemoteLibraryType;
    hostname: string;
    port: number;
    useSsl?: boolean;
    baseUrl?: string;
    apiKey?: string;
    plexToken?: string;
    deviceId?: string;
    syncEnabled?: boolean;
  }
>('/', async (req, res, next) => {
  const repository = getRepository(RemoteLibrary);

  if (!Object.values(RemoteLibraryType).includes(req.body.type)) {
    return next({
      status: 400,
      message: `Invalid library type: ${req.body.type}`,
    });
  }

  const library = repository.create({
    name: req.body.name,
    type: req.body.type,
    hostname: req.body.hostname,
    port: req.body.port,
    useSsl: req.body.useSsl ?? false,
    baseUrl: req.body.baseUrl,
    apiKey: req.body.apiKey,
    plexToken: req.body.plexToken,
    deviceId: req.body.deviceId,
    syncEnabled: req.body.syncEnabled ?? true,
    isEnabled: true,
  });

  await repository.save(library);

  return res.status(201).json(library);
});

remoteLibraryRoutes.post('/test', async (req, res, next) => {
  try {
    const { type, hostname, port, useSsl, baseUrl, apiKey, deviceId } =
      req.body;

    const protocol = useSsl ? 'https' : 'http';
    const base = baseUrl ? `/${baseUrl.replace(/^\/|\/$/g, '')}` : '';
    const url = `${protocol}://${hostname}:${port}${base}`;

    if (
      type === RemoteLibraryType.JELLYFIN ||
      type === RemoteLibraryType.EMBY
    ) {
      const safeDeviceId =
        deviceId && deviceId.length > 0
          ? deviceId
          : Buffer.from('BOT_seerr').toString('base64');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] =
          `MediaBrowser Client="Seerr", Device="Seerr", DeviceId="${safeDeviceId}", Version="1.0.0", Token="${apiKey}"`;
      }

      await axios.get(`${url}/System/Info`, {
        headers,
        timeout: 10000,
      });
    } else {
      await axios.get(`${url}/api/v1/status`, {
        headers: apiKey ? { 'X-Api-Key': apiKey } : {},
        timeout: 10000,
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    logger.debug('Failed to test remote library connection', {
      label: 'Remote Library',
      errorMessage: (e as Error).message,
    });
    return next({
      status: 500,
      message: 'Failed to connect to remote library',
    });
  }
});

remoteLibraryRoutes.put<{ id: string }, RemoteLibrary, Partial<RemoteLibrary>>(
  '/:id',
  async (req, res, next) => {
    const repository = getRepository(RemoteLibrary);

    const library = await repository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!library) {
      return next({
        status: 404,
        message: 'Remote library not found',
      });
    }

    if (
      req.body.type &&
      !Object.values(RemoteLibraryType).includes(req.body.type)
    ) {
      return next({
        status: 400,
        message: `Invalid library type: ${req.body.type}`,
      });
    }

    repository.merge(library, req.body);
    await repository.save(library);

    return res.status(200).json(library);
  }
);

remoteLibraryRoutes.delete<{ id: string }>('/:id', async (req, res, next) => {
  const repository = getRepository(RemoteLibrary);

  const library = await repository.findOne({
    where: { id: Number(req.params.id) },
  });

  if (!library) {
    return next({
      status: 404,
      message: 'Remote library not found',
    });
  }

  await repository.remove(library);

  return res.status(204).send();
});

remoteLibraryRoutes.get('/sync/status', (_req, res) => {
  const seerrStatus = seerrScanner.status();
  const embyJellyfinStatus = embyJellyfinScanner.status();

  return res.status(200).json({
    seerr: seerrStatus,
    embyJellyfin: embyJellyfinStatus,
  });
});

remoteLibraryRoutes.post<{ id: string }>(
  '/:id/sync',
  async (req, res, next) => {
    const repository = getRepository(RemoteLibrary);

    const library = await repository.findOne({
      where: { id: Number(req.params.id) },
    });

    if (!library) {
      return next({
        status: 404,
        message: 'Remote library not found',
      });
    }

    if (library.type === RemoteLibraryType.SEERR) {
      seerrScanner.run().catch((err) => {
        logger.error('Failed to sync Seerr remote library', {
          label: 'Remote Library',
          errorMessage: err.message,
        });
      });
    } else if (
      library.type === RemoteLibraryType.JELLYFIN ||
      library.type === RemoteLibraryType.EMBY
    ) {
      embyJellyfinScanner.run().catch((err) => {
        logger.error('Failed to sync Emby/Jellyfin remote library', {
          label: 'Remote Library',
          errorMessage: err.message,
        });
      });
    }

    return res.status(200).json({ message: 'Sync started' });
  }
);

remoteLibraryRoutes.get('/sync/status', (_req, res) => {
  const seerrStatus = seerrScanner.status();
  const embyJellyfinStatus = embyJellyfinScanner.status();

  return res.status(200).json({
    seerr: seerrStatus,
    embyJellyfin: embyJellyfinStatus,
  });
});

export default remoteLibraryRoutes;
