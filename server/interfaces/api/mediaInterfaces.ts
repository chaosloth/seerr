import type Media from '@server/entity/Media';
import { User } from '@server/entity/User';
import type { PaginatedResponse } from './common';

export interface MediaResultsResponse extends PaginatedResponse {
  results: Media[];
}

export interface MediaWatchDataResponse {
  data?: {
    users: User[];
    playCount: number;
    playCount7Days: number;
    playCount30Days: number;
  };
  data4k?: {
    users: User[];
    playCount: number;
    playCount7Days: number;
    playCount30Days: number;
  };
}

export interface RemoteAvailability {
  remoteLibraryId: number;
  remoteLibraryName: string;
  remoteLibraryType: string;
  status: number;
  remoteId?: string;
}
