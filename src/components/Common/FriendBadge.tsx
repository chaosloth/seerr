import Badge from '@app/components/Common/Badge';
import type { RemoteAvailability } from '@server/interfaces/api/mediaInterfaces';
import { UsersIcon } from '@heroicons/react/24/solid';

interface FriendBadgeProps {
  remoteAvailability: RemoteAvailability[];
}

const FriendBadge = ({ remoteAvailability }: FriendBadgeProps) => {
  if (!remoteAvailability || remoteAvailability.length === 0) {
    return null;
  }

  const count = remoteAvailability.length;
  const names = remoteAvailability
    .map((r) => r.remoteLibraryName)
    .join(', ');

  return (
    <span
      title={`Available on: ${names}`}
      className="relative inline-flex items-center"
    >
      <Badge badgeType="primary">
        <UsersIcon className="mr-0.5 h-3 w-3 inline" />
        {count}
      </Badge>
    </span>
  );
};

export default FriendBadge;
