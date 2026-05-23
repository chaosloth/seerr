import SettingsLayout from '@app/components/Settings/SettingsLayout';
import SettingsRemoteLibrary from '@app/components/Settings/SettingsRemoteLibrary';
import type { NextPage } from 'next';

const RemoteLibraryPage: NextPage = () => {
  return (
    <SettingsLayout>
      <SettingsRemoteLibrary />
    </SettingsLayout>
  );
};

export default RemoteLibraryPage;
