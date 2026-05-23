import { RemoteLibraryType } from '@server/constants/server';
import { getRepository } from '@server/datasource';
import { RemoteLibrary } from '@server/entity/RemoteLibrary';
import { Permission } from '@server/lib/permissions';
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
    syncEnabled: req.body.syncEnabled ?? true,
    isEnabled: true,
  });

  await repository.save(library);

  return res.status(201).json(library);
});

remoteLibraryRoutes.post('/test', async (req, res, next) => {
  try {
    const { hostname, port, useSsl, baseUrl, apiKey } = req.body;

    const protocol = useSsl ? 'https' : 'http';
    const base = baseUrl
      ? `/${baseUrl.replace(/^\/|\/$/g, '')}`
      : '';
    const url = `${protocol}://${hostname}:${port}${base}`;

    await axios.get(`${url}/api/v1/status`, {
      headers: apiKey ? { 'X-Api-Key': apiKey } : {},
      timeout: 10000,
    });

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

remoteLibraryRoutes.delete<{ id: string }>(
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

    await repository.remove(library);

    return res.status(204).send();
  }
);

export default remoteLibraryRoutes;
