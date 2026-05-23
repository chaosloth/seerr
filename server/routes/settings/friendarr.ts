import type { FriendarrSettings } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { Router } from 'express';

const friendarrRoutes = Router();

friendarrRoutes.get('/', (_req, res) => {
  const settings = getSettings();

  return res.status(200).json(settings.friendarr);
});

friendarrRoutes.post('/', async (req, res) => {
  const settings = getSettings();

  settings.friendarr = req.body as FriendarrSettings;
  await settings.save();

  return res.status(200).json(settings.friendarr);
});

friendarrRoutes.post('/test', async (req, res, next) => {
  try {
    const { hostname, port, useSsl, baseUrl, apiKey } = req.body as {
      hostname: string;
      port: number;
      useSsl: boolean;
      baseUrl?: string;
      apiKey: string;
    };

    const protocol = useSsl ? 'https' : 'http';
    const base = baseUrl ? `/${baseUrl.replace(/^\/|\/$/g, '')}` : '';
    const url = `${protocol}://${hostname}:${port}${base}`;

    const response = await axios.get(`${url}/api/v1/health`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      timeout: 10000,
    });

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (e) {
    logger.debug('Failed to test Friendarr connection', {
      label: 'Friendarr',
      errorMessage: (e as Error).message,
    });
    return next({
      status: 500,
      message: 'Failed to connect to Friendarr',
    });
  }
});

export default friendarrRoutes;
