import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useToasts from '@app/hooks/useToasts';
import defineMessages from '@app/utils/defineMessages';
import type { FriendarrSettings } from '@server/lib/settings';
import axios from 'axios';
import { useState } from 'react';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Settings.FriendarrModal', {
  title: 'Friendarr',
  description: 'Configure the downloading service for remote library requests.',
  enabed: 'Enable Friendarr',
  enabledDescription:
    'Send remote library requests to Friendarr for downloading.',
  hostname: 'Hostname or IP Address',
  hostnamePlaceholder: 'localhost',
  port: 'Port',
  ssl: 'Use SSL',
  apiKey: 'API Key',
  baseUrl: 'URL Base',
  test: 'Test',
  save: 'Save',
  testing: 'Testing...',
  testSuccess: 'Connection established successfully!',
  testFailure: 'Failed to connect to Friendarr.',
  saveSuccess: 'Friendarr settings saved successfully!',
  saveFailure: 'Failed to save Friendarr settings.',
  validationHostnameRequired: 'You must provide a hostname or IP address',
  validationPortRequired: 'You must provide a valid port number',
});

interface FriendarrModalProps {
  settings: FriendarrSettings;
  onSave: () => void;
}

const FriendarrModal = ({ settings, onSave }: FriendarrModalProps) => {
  const intl = useIntl();
  const { addToast } = useToasts();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [hostname, setHostname] = useState(settings.hostname ?? 'localhost');
  const [port, setPort] = useState(settings.port?.toString() ?? '5056');
  const [useSsl, setUseSsl] = useState(settings.useSsl ?? false);
  const [apiKey, setApiKey] = useState(settings.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl ?? '');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await axios.post('/api/v1/settings/friendarr/test', {
        hostname,
        port: Number(port),
        useSsl,
        baseUrl: baseUrl || undefined,
        apiKey,
      });
      setTestResult(true);
      addToast(intl.formatMessage(messages.testSuccess), {
        appearance: 'success',
      });
    } catch {
      setTestResult(false);
      addToast(intl.formatMessage(messages.testFailure), {
        appearance: 'error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axios.post('/api/v1/settings/friendarr', {
        enabled,
        hostname,
        port: Number(port),
        useSsl,
        baseUrl: baseUrl || undefined,
        apiKey,
      });
      addToast(intl.formatMessage(messages.saveSuccess), {
        appearance: 'success',
      });
      onSave();
    } catch {
      addToast(intl.formatMessage(messages.saveFailure), {
        appearance: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = enabled
    ? hostname.trim().length > 0 && Number(port) > 0
    : true;

  return (
    <Modal
      title={intl.formatMessage(messages.title)}
      subTitle={intl.formatMessage(messages.description)}
      onOk={handleSave}
      okDisabled={!isValid || isSaving}
      okText={intl.formatMessage(messages.save)}
      okButtonType="primary"
    >
      <div>
        <div className="form-row">
          <label htmlFor="enabled" className="text-label">
            {intl.formatMessage(messages.enabed)}
          </label>
          <div className="form-input-area">
            <div className="form-input-field">
              <input
                id="enabled"
                type="checkbox"
                className="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
            </div>
            <div className="mt-1 text-sm text-gray-400">
              {intl.formatMessage(messages.enabledDescription)}
            </div>
          </div>
        </div>
        {enabled && (
          <>
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
                    placeholder={intl.formatMessage(
                      messages.hostnamePlaceholder
                    )}
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
              <div className="form-input-area">
                <div className="form-input-field">
                  <Button
                    buttonType="ghost"
                    onClick={handleTest}
                    disabled={isTesting}
                  >
                    {isTesting
                      ? intl.formatMessage(messages.testing)
                      : intl.formatMessage(messages.test)}
                  </Button>
                  {testResult !== null && (
                    <Badge
                      badgeType={testResult ? 'success' : 'danger'}
                      className="ml-2"
                    >
                      {testResult
                        ? intl.formatMessage(messages.testSuccess)
                        : intl.formatMessage(messages.testFailure)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default FriendarrModal;
