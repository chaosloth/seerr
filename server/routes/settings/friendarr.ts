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

    const response = await axios.get(`${url}/api/v1/verify`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      timeout: 10000,
    });

    if (!response.data || response.data.status !== 'ok') {
      return next({
        status: 500,
        message:
          'Connected but the server does not appear to be a Friendarr instance.',
      });
    }

    return res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response) {
        const status = e.response.status;
        if (status === 401) {
          return next({
            status: 401,
            message: 'Authentication required. Please provide a valid API key.',
          });
        }
        if (status === 403) {
          return next({
            status: 403,
            message:
              'Invalid API key. Check your Friendarr API key and try again.',
          });
        }
      }
      if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') {
        return next({
          status: 502,
          message: 'Could not reach Friendarr. Check the hostname and port.',
        });
      }
      logger.debug('Failed to test Friendarr connection', {
        label: 'Friendarr',
        status: e.response?.status,
        errorMessage: e.message,
      });
      return next({
        status: 502,
        message: `Friendarr error: ${e.message}`,
      });
    }

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
