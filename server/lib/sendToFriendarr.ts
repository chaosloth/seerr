import type { RemoteLibrary } from '@server/entity/RemoteLibrary';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';

export async function sendToFriendarr(
  requestId: number,
  mediaType: string,
  tmdbId: number,
  remoteLibrary: RemoteLibrary
): Promise<{ friendarrDownloadId: string; downloadStatusUrl: string }> {
  const settings = getSettings();
  const friendarr = settings.friendarr;

  let friendarrUrl: string;
  let friendarrApiKey: string | undefined;

  if (friendarr.enabled) {
    const protocol = friendarr.useSsl ? 'https' : 'http';
    const base = friendarr.baseUrl
      ? `/${friendarr.baseUrl.replace(/^\/|\/$/g, '')}`
      : '';
    friendarrUrl = `${protocol}://${friendarr.hostname}:${friendarr.port}${base}`;
    friendarrApiKey = friendarr.apiKey || undefined;
  } else {
    friendarrUrl = process.env.FRIENDARR_URL ?? 'http://localhost:5056';
    friendarrApiKey = process.env.FRIENDARR_API_KEY;
  }

  const protocol = remoteLibrary.useSsl ? 'https' : 'http';
  const base = remoteLibrary.baseUrl
    ? `/${remoteLibrary.baseUrl.replace(/^\/|\/$/g, '')}`
    : '';
  const remoteUrl = `${protocol}://${remoteLibrary.hostname}:${remoteLibrary.port}${base}`;

  const response = await axios.post(
    `${friendarrUrl}/api/v1/download`,
    {
      source: {
        type: remoteLibrary.type,
        url: remoteUrl,
        authToken: remoteLibrary.apiKey ?? remoteLibrary.plexToken ?? undefined,
        deviceId: remoteLibrary.deviceId ?? undefined,
        mediaId: String(tmdbId),
      },
      destination: {
        mediaType,
        tmdbId,
        title: `TMDB-${tmdbId}`,
        year: 0,
        libraryPath: '',
      },
      metadata: {
        nfo: true,
        poster: true,
        fanart: true,
      },
    },
    {
      headers: friendarrApiKey
        ? { Authorization: `Bearer ${friendarrApiKey}` }
        : {},
      timeout: 10000,
    }
  );

  logger.info(
    `Sent request ${requestId} to Friendarr from ${remoteLibrary.name}`,
    {
      label: 'Media Request',
      friendarrUrl,
      friendarrDownloadId: response.data.id,
      hasApiKey: !!friendarrApiKey,
    }
  );

  return {
    friendarrDownloadId: response.data.id,
    downloadStatusUrl: `${friendarrUrl}/api/v1/status/${response.data.id}`,
  };
}
