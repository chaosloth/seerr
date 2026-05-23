import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import Modal from '@app/components/Common/Modal';
import PageTitle from '@app/components/Common/PageTitle';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useToasts from '@app/hooks/useToasts';
import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import { Transition } from '@headlessui/react';
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import { RemoteLibraryType } from '@server/constants/server';
import type { RemoteLibrary } from '@server/entity/RemoteLibrary';
import axios from 'axios';
import { Fragment, useState } from 'react';
import { useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';

const messages = defineMessages('components.Settings.RemoteLibrary', {
  remotesettings: 'Remote Libraries',
  remotesettingsDescription:
    "Configure remote libraries to discover content available on your friends' servers. Remote libraries will appear as availability badges on the discovery page.",
  addremote: 'Add Remote Library',
  editremote: 'Edit Remote Library',
  deleteremoteconfirm: 'Are you sure you want to delete this remote library?',
  name: 'Library Name',
  namePlaceholder: "My Friend's Server",
  type: 'Library Type',
  hostname: 'Hostname or IP Address',
  hostnamePlaceholder: '192.168.1.100',
  port: 'Port',
  ssl: 'Use SSL',
  apiKey: 'API Key',
  baseUrl: 'URL Base',
  syncEnabled: 'Enable Sync',
  plexToken: 'Plex Token',
  address: 'Address',
  sslLabel: 'SSL',
  actions: 'Actions',
  delete: 'Delete',
  savelibrary: 'Save Library',
  addlibrary: 'Add Library',
  validationNameRequired: 'You must provide a library name',
  validationHostnameRequired: 'You must provide a valid hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
  validationTypeRequired: 'You must select a library type',
  toastRemoteLibraryTestSuccess: 'Connection established successfully!',
  toastRemoteLibraryTestFailure: 'Failed to connect to remote library.',
  toastRemoteLibraryCreateSuccess: 'Remote library created successfully!',
  toastRemoteLibraryCreateFailure: 'Failed to create remote library.',
  toastRemoteLibraryUpdateSuccess: 'Remote library updated successfully!',
  toastRemoteLibraryUpdateFailure: 'Failed to update remote library.',
  toastRemoteLibraryDeleteSuccess: 'Remote library deleted successfully!',
  toastRemoteLibraryDeleteFailure: 'Failed to delete remote library.',
  test: 'Test',
  seerrLabel: 'Seerr',
  jellyfinLabel: 'Jellyfin',
  embyLabel: 'Emby',
  plexLabel: 'Plex',
  noRemoteLibraries: 'No remote libraries configured.',
  syncing: 'Syncing',
});

type LibraryTypeOption = {
  value: RemoteLibraryType;
  label: string;
};

const libraryTypeOptions: LibraryTypeOption[] = [
  { value: RemoteLibraryType.SEERR, label: 'Seerr' },
  { value: RemoteLibraryType.JELLYFIN, label: 'Jellyfin' },
  { value: RemoteLibraryType.EMBY, label: 'Emby' },
  { value: RemoteLibraryType.PLEX, label: 'Plex' },
];

const SettingsRemoteLibrary = () => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<RemoteLibrary | null>(
    null
  );
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const { data, error } = useSWR<RemoteLibrary[]>('/api/v1/remoteLibrary');

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  const closeModal = () => {
    setModalOpen(false);
    setEditingLibrary(null);
    setTestResult(null);
  };

  const openAddModal = () => {
    setEditingLibrary(null);
    setTestResult(null);
    setModalOpen(true);
  };

  const openEditModal = (library: RemoteLibrary) => {
    setEditingLibrary(library);
    setTestResult(null);
    setModalOpen(true);
  };

  const handleDelete = async (library: RemoteLibrary) => {
    try {
      await axios.delete(`/api/v1/remoteLibrary/${library.id}`);
      addToast(intl.formatMessage(messages.toastRemoteLibraryDeleteSuccess));
      mutate('/api/v1/remoteLibrary');
    } catch {
      addToast(intl.formatMessage(messages.toastRemoteLibraryDeleteFailure), {
        appearance: 'error',
      });
    }
  };

  const handleTest = async (values: {
    name: string;
    type: RemoteLibraryType;
    hostname: string;
    port: number;
    useSsl: boolean;
    baseUrl?: string;
    apiKey?: string;
  }) => {
    try {
      await axios.post('/api/v1/remoteLibrary/test', values);
      setTestResult(true);
      addToast(intl.formatMessage(messages.toastRemoteLibraryTestSuccess), {
        appearance: 'success',
      });
    } catch {
      setTestResult(false);
      addToast(intl.formatMessage(messages.toastRemoteLibraryTestFailure), {
        appearance: 'error',
      });
    }
  };

  const handleSubmit = async (values: {
    name: string;
    type: RemoteLibraryType;
    hostname: string;
    port: number;
    useSsl: boolean;
    baseUrl?: string;
    apiKey?: string;
    plexToken?: string;
    syncEnabled: boolean;
  }) => {
    try {
      if (editingLibrary) {
        await axios.put(`/api/v1/remoteLibrary/${editingLibrary.id}`, values);
        addToast(intl.formatMessage(messages.toastRemoteLibraryUpdateSuccess), {
          appearance: 'success',
        });
      } else {
        await axios.post('/api/v1/remoteLibrary', values);
        addToast(intl.formatMessage(messages.toastRemoteLibraryCreateSuccess), {
          appearance: 'success',
        });
      }
      mutate('/api/v1/remoteLibrary');
      closeModal();
    } catch {
      addToast(
        editingLibrary
          ? intl.formatMessage(messages.toastRemoteLibraryUpdateFailure)
          : intl.formatMessage(messages.toastRemoteLibraryCreateFailure),
        { appearance: 'error' }
      );
    }
  };

  const getTypeLabel = (type: RemoteLibraryType) => {
    switch (type) {
      case RemoteLibraryType.SEERR:
        return intl.formatMessage(messages.seerrLabel);
      case RemoteLibraryType.JELLYFIN:
        return intl.formatMessage(messages.jellyfinLabel);
      case RemoteLibraryType.EMBY:
        return intl.formatMessage(messages.embyLabel);
      case RemoteLibraryType.PLEX:
        return intl.formatMessage(messages.plexLabel);
      default:
        return type;
    }
  };

  const buildUrl = (library: RemoteLibrary) => {
    const protocol = library.useSsl ? 'https' : 'http';
    const base = library.baseUrl
      ? `/${library.baseUrl.replace(/^\/|\/$/g, '')}`
      : '';
    return `${protocol}://${library.hostname}:${library.port}${base}`;
  };

  return (
    <>
      <PageTitle
        title={[
          intl.formatMessage(globalMessages.settings),
          intl.formatMessage(messages.remotesettings),
        ]}
      />
      <div>
        <div className="mb-2 flex flex-col justify-between lg:flex-row lg:items-end">
          <div>
            <div className="mb-2 mt-1">
              <h2 className="text-lg font-bold leading-7 text-gray-300">
                {intl.formatMessage(messages.remotesettings)}
              </h2>
            </div>
            <div className="text-gray-500">
              {intl.formatMessage(messages.remotesettingsDescription)}
            </div>
          </div>
          <div className="mt-4 flex flex-shrink-0 lg:ml-4 lg:mt-0">
            <Button buttonType="primary" onClick={openAddModal}>
              <PlusIcon className="mr-1 h-5 w-5" />
              {intl.formatMessage(messages.addremote)}
            </Button>
          </div>
        </div>
        <div>
          {data?.length === 0 ? (
            <div className="text-gray-500">
              {intl.formatMessage(messages.noRemoteLibraries)}
            </div>
          ) : (
            <ul className="space-y-4">
              {data?.map((library) => (
                <ServerInstance
                  key={library.id}
                  library={library}
                  typeLabel={getTypeLabel(library.type)}
                  address={buildUrl(library)}
                  onEdit={() => openEditModal(library)}
                  onDelete={() => handleDelete(library)}
                  intl={intl}
                />
              ))}
            </ul>
          )}
        </div>
        <Transition
          as={Fragment}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          show={isModalOpen}
        >
          <RemoteLibraryModal
            key={editingLibrary ? editingLibrary.id : 'new'}
            library={editingLibrary}
            onClose={closeModal}
            onTest={handleTest}
            onSubmit={handleSubmit}
            testResult={testResult}
            intl={intl}
          />
        </Transition>
      </div>
    </>
  );
};

interface ServerInstanceProps {
  library: RemoteLibrary;
  typeLabel: string;
  address: string;
  intl: ReturnType<typeof useIntl>;
  onEdit: () => void;
  onDelete: () => void;
}

const ServerInstance = ({
  library,
  typeLabel,
  address,
  intl,
  onEdit,
  onDelete,
}: ServerInstanceProps) => {
  return (
    <li className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-medium text-gray-200">
              {library.name}
            </span>
            <Badge>{typeLabel}</Badge>
            {library.useSsl && (
              <Badge badgeType="success">
                {intl.formatMessage(messages.sslLabel)}
              </Badge>
            )}
          </div>
          <div className="mt-1 text-sm text-gray-400">{address}</div>
          {library.syncEnabled && (
            <div className="mt-1 text-xs text-gray-500">
              {intl.formatMessage(messages.syncing)}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button buttonType="ghost" onClick={onEdit}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            buttonType="ghost"
            onClick={async () => {
              if (confirm(intl.formatMessage(messages.deleteremoteconfirm))) {
                onDelete();
              }
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
};

interface RemoteLibraryModalProps {
  library: RemoteLibrary | null;
  onClose: () => void;
  onTest: (values: {
    name: string;
    type: RemoteLibraryType;
    hostname: string;
    port: number;
    useSsl: boolean;
    baseUrl?: string;
    apiKey?: string;
  }) => Promise<void>;
  onSubmit: (values: {
    name: string;
    type: RemoteLibraryType;
    hostname: string;
    port: number;
    useSsl: boolean;
    baseUrl?: string;
    apiKey?: string;
    plexToken?: string;
    syncEnabled: boolean;
  }) => Promise<void>;
  testResult: boolean | null;
  intl: ReturnType<typeof useIntl>;
}

const RemoteLibraryModal = ({
  library,
  onClose,
  onTest,
  onSubmit,
  testResult,
  intl,
}: RemoteLibraryModalProps) => {
  const [name, setName] = useState(library?.name ?? '');
  const [type, setType] = useState<RemoteLibraryType>(
    library?.type ?? RemoteLibraryType.SEERR
  );
  const [hostname, setHostname] = useState(library?.hostname ?? '');
  const [port, setPort] = useState(library?.port?.toString() ?? '5055');
  const [useSsl, setUseSsl] = useState(library?.useSsl ?? false);
  const [baseUrl, setBaseUrl] = useState(library?.baseUrl ?? '');
  const [apiKey, setApiKey] = useState(library?.apiKey ?? '');
  const [plexToken, setPlexToken] = useState(library?.plexToken ?? '');
  const [syncEnabled, setSyncEnabled] = useState(library?.syncEnabled ?? true);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      name,
      type,
      hostname,
      port: Number(port),
      useSsl,
      baseUrl: baseUrl || undefined,
      apiKey: apiKey || undefined,
      plexToken:
        type === RemoteLibraryType.PLEX ? plexToken || undefined : undefined,
      syncEnabled,
    });
    setSubmitting(false);
  };

  const handleTest = async () => {
    await onTest({
      name,
      type,
      hostname,
      port: Number(port),
      useSsl,
      baseUrl: baseUrl || undefined,
      apiKey: apiKey || undefined,
    });
  };

  const isValid =
    name.trim().length > 0 && hostname.trim().length > 0 && Number(port) > 0;

  return (
    <Modal
      title={
        library
          ? intl.formatMessage(messages.editremote)
          : intl.formatMessage(messages.addremote)
      }
      onCancel={onClose}
      onOk={handleSubmit}
      okDisabled={!isValid || isSubmitting}
      okText={
        library
          ? intl.formatMessage(messages.savelibrary)
          : intl.formatMessage(messages.addlibrary)
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-label" htmlFor="name">
            {intl.formatMessage(messages.name)}
          </label>
          <input
            id="name"
            type="text"
            className="input-text mt-1 block w-full rounded-md"
            placeholder={intl.formatMessage(messages.namePlaceholder)}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-label" htmlFor="type">
            {intl.formatMessage(messages.type)}
          </label>
          <select
            id="type"
            className="input-select mt-1 block w-full rounded-md"
            value={type}
            onChange={(e) => setType(e.target.value as RemoteLibraryType)}
          >
            {libraryTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-label" htmlFor="hostname">
            {intl.formatMessage(messages.hostname)}
          </label>
          <input
            id="hostname"
            type="text"
            className="input-text mt-1 block w-full rounded-md"
            placeholder={intl.formatMessage(messages.hostnamePlaceholder)}
            value={hostname}
            onChange={(e) => setHostname(e.target.value)}
          />
        </div>
        <div>
          <label className="text-label" htmlFor="port">
            {intl.formatMessage(messages.port)}
          </label>
          <input
            id="port"
            type="number"
            className="input-text mt-1 block w-full rounded-md"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <input
            id="useSsl"
            type="checkbox"
            className="checkbox mr-2"
            checked={useSsl}
            onChange={(e) => setUseSsl(e.target.checked)}
          />
          <label className="text-label" htmlFor="useSsl">
            {intl.formatMessage(messages.ssl)}
          </label>
        </div>
        <div>
          <label className="text-label" htmlFor="baseUrl">
            {intl.formatMessage(messages.baseUrl)}
          </label>
          <input
            id="baseUrl"
            type="text"
            className="input-text mt-1 block w-full rounded-md"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="text-label" htmlFor="apiKey">
            {intl.formatMessage(messages.apiKey)}
          </label>
          <SensitiveInput
            id="apiKey"
            className="input-text mt-1 block w-full rounded-md"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        {type === RemoteLibraryType.PLEX && (
          <div>
            <label className="text-label" htmlFor="plexToken">
              {intl.formatMessage(messages.plexToken)}
            </label>
            <SensitiveInput
              id="plexToken"
              className="input-text mt-1 block w-full rounded-md"
              value={plexToken}
              onChange={(e) => setPlexToken(e.target.value)}
            />
          </div>
        )}
        <div className="flex items-center">
          <input
            id="syncEnabled"
            type="checkbox"
            className="checkbox mr-2"
            checked={syncEnabled}
            onChange={(e) => setSyncEnabled(e.target.checked)}
          />
          <label className="text-label" htmlFor="syncEnabled">
            {intl.formatMessage(messages.syncEnabled)}
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Button buttonType="ghost" onClick={handleTest}>
            {intl.formatMessage(messages.test)}
          </Button>
          {testResult !== null && (
            <Badge badgeType={testResult ? 'success' : 'danger'}>
              {testResult
                ? intl.formatMessage(messages.toastRemoteLibraryTestSuccess)
                : intl.formatMessage(messages.toastRemoteLibraryTestFailure)}
            </Badge>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsRemoteLibrary;
