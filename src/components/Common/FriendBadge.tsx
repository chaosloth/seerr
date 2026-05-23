import Badge from '@app/components/Common/Badge';
import { UsersIcon } from '@heroicons/react/24/solid';
import type { RemoteAvailability } from '@server/interfaces/api/mediaInterfaces';

interface FriendBadgeProps {
  remoteAvailability: RemoteAvailability[];
}

const FriendBadge = ({ remoteAvailability }: FriendBadgeProps) => {
  if (!remoteAvailability || remoteAvailability.length === 0) {
    return null;
  }

  const count = remoteAvailability.length;
  const names = remoteAvailability.map((r) => r.remoteLibraryName).join(', ');

  return (
    <span title={`Available on: ${names}`} className="inline-flex items-center">
      <Badge badgeType="primary" className="seerr-friends-badge">
        <span className="inline-flex items-center gap-0.5">
          <UsersIcon className="seerr-friends-badge-icon h-3 w-3" />
          <span>{count}</span>
        </span>
      </Badge>
    </span>
  );
};

export default FriendBadge;
