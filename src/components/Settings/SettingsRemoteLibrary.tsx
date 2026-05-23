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
import {
  ArrowPathIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { RemoteLibraryType } from '@server/constants/server';
import type { RemoteLibrary } from '@server/entity/RemoteLibrary';
import axios from 'axios';
import React, { Fragment, useState } from 'react';
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
  syncnow: 'Sync Now',
  lastsynced: 'Last synced: {time}',
  never: 'Never',
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
  const [syncingIds, setSyncingIds] = useState<Set<number>>(new Set());

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

  const handleSync = async (library: RemoteLibrary) => {
    setSyncingIds((prev) => new Set(prev).add(library.id));
    try {
      await axios.post(`/api/v1/remoteLibrary/${library.id}/sync`);
      addToast(`Sync started for ${library.name}`, {
        appearance: 'success',
      });
      // Poll for completion by refreshing the list
      setTimeout(() => mutate('/api/v1/remoteLibrary'), 3000);
      setTimeout(() => mutate('/api/v1/remoteLibrary'), 10000);
    } catch {
      addToast(`Failed to sync ${library.name}`, { appearance: 'error' });
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(library.id);
        return next;
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
                  isSyncing={syncingIds.has(library.id)}
                  onEdit={() => openEditModal(library)}
                  onDelete={() => handleDelete(library)}
                  onSync={() => handleSync(library)}
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
  isSyncing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
}

const ServerInstance = ({
  library,
  typeLabel,
  address,
  intl,
  isSyncing,
  onEdit,
  onDelete,
  onSync,
}: ServerInstanceProps) => {
  const formatRelativeTime = (date: Date | undefined): string => {
    if (!date) return intl.formatMessage(messages.never);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

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
            <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
              <span>
                {intl.formatMessage(messages.lastsynced, {
                  time: formatRelativeTime(
                    library.lastSyncAt
                      ? new Date(library.lastSyncAt)
                      : undefined
                  ),
                })}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onSync();
                }}
                disabled={isSyncing}
                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
              >
                <ArrowPathIcon
                  className={`mr-1 h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {intl.formatMessage(messages.syncnow)}
              </button>
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

const RemoteLibraryModal = React.forwardRef<
  HTMLDivElement,
  RemoteLibraryModalProps
>(({ library, onClose, onTest, onSubmit, testResult, intl }, ref) => {
  const [name, setName] = useState(library?.name ?? '');
  const [type, setTypeState] = useState<RemoteLibraryType>(
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

  const setType = (newType: RemoteLibraryType) => {
    setTypeState(newType);
    // Set default port for service if user hasn't manually entered one yet
    if (!library) {
      switch (newType) {
        case RemoteLibraryType.SEERR:
          setPort('5055');
          break;
        case RemoteLibraryType.JELLYFIN:
        case RemoteLibraryType.EMBY:
          setPort('8096');
          break;
        case RemoteLibraryType.PLEX:
          setPort('32400');
          break;
      }
    }
  };

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
      ref={ref}
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
      <div>
        <div className="form-row">
          <label htmlFor="name" className="text-label">
            {intl.formatMessage(messages.name)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="name"
                type="text"
                className="input-text rounded-md"
                placeholder={intl.formatMessage(messages.namePlaceholder)}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="type" className="text-label">
            {intl.formatMessage(messages.type)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <select
                id="type"
                className="input-select rounded-md"
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
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="hostname" className="text-label">
            {intl.formatMessage(messages.hostname)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="hostname"
                type="text"
                className="input-text rounded-md"
                placeholder={intl.formatMessage(messages.hostnamePlaceholder)}
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="port" className="text-label">
            {intl.formatMessage(messages.port)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="port"
                type="number"
                className="input-text rounded-md"
                value={port}
                onChange={(e) => setPort(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="useSsl" className="text-label">
            {intl.formatMessage(messages.ssl)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="useSsl"
                type="checkbox"
                className="checkbox"
                checked={useSsl}
                onChange={(e) => setUseSsl(e.target.checked)}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="baseUrl" className="text-label">
            {intl.formatMessage(messages.baseUrl)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="baseUrl"
                type="text"
                className="input-text rounded-md"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <label htmlFor="apiKey" className="text-label">
            {intl.formatMessage(messages.apiKey)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <SensitiveInput
                as="input"
                type="text"
                id="apiKey"
                value={apiKey}
                onChange={(e) =>
                  setApiKey((e.target as HTMLInputElement).value)
                }
              />
            </div>
          </div>
        </div>
        {type === RemoteLibraryType.PLEX && (
          <div className="form-row">
            <label htmlFor="plexToken" className="text-label">
              {intl.formatMessage(messages.plexToken)}
            </label>
            <div className="form-input-area">
              <div className="form-input-field">
                <SensitiveInput
                  as="input"
                  type="text"
                  id="plexToken"
                  value={plexToken}
                  onChange={(e) =>
                    setPlexToken((e.target as HTMLInputElement).value)
                  }
                />
              </div>
            </div>
          </div>
        )}
        <div className="form-row">
          <label htmlFor="syncEnabled" className="text-label">
            {intl.formatMessage(messages.syncEnabled)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="syncEnabled"
                type="checkbox"
                className="checkbox"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
              />
            </div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-input-area">
            <div className="form-input-field">
              <Button buttonType="ghost" onClick={handleTest}>
                {intl.formatMessage(messages.test)}
              </Button>
              {testResult !== null && (
                <Badge
                  badgeType={testResult ? 'success' : 'danger'}
                  className="ml-2"
                >
                  {testResult
                    ? intl.formatMessage(messages.toastRemoteLibraryTestSuccess)
                    : intl.formatMessage(
                        messages.toastRemoteLibraryTestFailure
                      )}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
});

export default SettingsRemoteLibrary;
