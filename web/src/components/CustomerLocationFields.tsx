import { useEffect, useState } from 'react';
import { Button, Card, Input, Space, Tabs, Typography, message } from 'antd';
import {
  EnvironmentOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Controller, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import {
  buildMapsUrl,
  formatCoordinates,
  hasValidCoordinates,
  parseCoordsFromUrl,
} from '@/utils/locationLink';

const { Text } = Typography;

export type LocationTab = 'link' | 'gps' | 'manual';

interface CustomerLocationFieldsProps {
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
  latitude?: number;
  longitude?: number;
  manualLocation?: string;
  resetKey?: string;
  onActiveTabChange?: (tab: LocationTab) => void;
  setValue: UseFormSetValue<Record<string, unknown>>;
}

const inferInitialTab = (
  latitude?: number,
  longitude?: number,
  manualLocation?: string,
): LocationTab => {
  if (hasValidCoordinates(latitude, longitude)) return 'gps';
  if (manualLocation?.trim()) return 'manual';
  return 'link';
};

export const CustomerLocationFields = ({
  control,
  errors,
  latitude,
  longitude,
  manualLocation,
  resetKey,
  onActiveTabChange,
  setValue,
}: CustomerLocationFieldsProps) => {
  const hasPin = hasValidCoordinates(latitude, longitude);
  const mapsUrl = hasPin ? buildMapsUrl(latitude!, longitude!) : undefined;

  const [activeTab, setActiveTab] = useState<LocationTab>(() =>
    inferInitialTab(latitude, longitude, manualLocation),
  );
  const [pastedLink, setPastedLink] = useState('');

  useEffect(() => {
    const tab = inferInitialTab(latitude, longitude, manualLocation);
    setActiveTab(tab);
    onActiveTabChange?.(tab);
    setPastedLink('');
  }, [resetKey]);

  const handleTabChange = (key: string) => {
    const tab = key as LocationTab;
    setActiveTab(tab);
    onActiveTabChange?.(tab);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported in this browser');
      return;
    }

    message.loading({ content: 'Getting GPS location…', key: 'geo', duration: 0 });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });
        setValue('manualLocation', '', { shouldValidate: true });
        message.success({ content: 'Exact location captured', key: 'geo' });
      },
      (err) => {
        message.error({
          content: err.message || 'Unable to get location. Allow location access and try again.',
          key: 'geo',
        });
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const handleExtractFromLink = () => {
    const coords = parseCoordsFromUrl(pastedLink);
    if (!hasValidCoordinates(coords.latitude, coords.longitude)) {
      message.error('Could not find coordinates in that link. Try a Google Maps or Waze share URL.');
      return;
    }

    setValue('latitude', coords.latitude, { shouldValidate: true });
    setValue('longitude', coords.longitude, { shouldValidate: true });
    setValue('manualLocation', '', { shouldValidate: true });
    message.success('Location extracted from link');
  };

  const clearLocation = () => {
    setValue('latitude', undefined, { shouldValidate: true });
    setValue('longitude', undefined, { shouldValidate: true });
  };

  const pinStatusBlock = hasPin ? (
    <div className="highlight-box mb-16">
      <Space>
        <CheckCircleOutlined className="icon-success" />
        <Text>
          <strong>Pin set:</strong> {formatCoordinates(latitude, longitude)}
        </Text>
      </Space>
    </div>
  ) : null;

  const pinActions = hasPin ? (
    <Space wrap className="mb-16">
      <Button icon={<LinkOutlined />} href={mapsUrl} target="_blank" rel="noopener noreferrer">
        Preview on Map
      </Button>
      <Button type="text" danger onClick={clearLocation}>
        Clear Pin
      </Button>
    </Space>
  ) : null;

  const deliveryNotesField = (
    <>
      <Text type="secondary" className="block mb-4">
        Optional delivery notes (landmark, gate color, floor, etc.)
      </Text>
      <Controller
        name="locationNotes"
        control={control}
        render={({ field }) => (
          <Input.TextArea
            {...field}
            value={typeof field.value === 'string' ? field.value : ''}
            rows={2}
            placeholder="e.g. Blue gate beside 7-Eleven, ask guard for Unit 3"
            maxLength={500}
            showCount
          />
        )}
      />
    </>
  );

  const tabItems = [
    {
      key: 'link',
      label: (
        <span>
          <LinkOutlined /> Paste Link
        </span>
      ),
      children: (
        <>
          <Text type="secondary" className="block mb-12">
            Paste a Google Maps or Waze share link. Coordinates will be extracted automatically.
          </Text>
          <Input.TextArea
            value={pastedLink}
            onChange={(e) => setPastedLink(e.target.value)}
            rows={2}
            placeholder="https://maps.google.com/... or https://waze.com/..."
            className="mb-12"
          />
          <Space wrap className="mb-16">
            <Button type="primary" icon={<LinkOutlined />} onClick={handleExtractFromLink} disabled={!pastedLink.trim()}>
              Extract Location
            </Button>
          </Space>
          {pinStatusBlock}
          {pinActions}
          {errors.longitude?.message && (
            <Text type="danger" className="block mb-12">
              {String(errors.longitude.message)}
            </Text>
          )}
        </>
      ),
    },
    {
      key: 'gps',
      label: (
        <span>
          <EnvironmentOutlined /> Use My Location
        </span>
      ),
      children: (
        <>
          <Text type="secondary" className="block mb-12">
            Pin the exact delivery spot using GPS. Allow location access when prompted.
          </Text>
          <Space wrap className="mb-16">
            <Button type="primary" icon={<EnvironmentOutlined />} onClick={handleUseMyLocation}>
              Use My Location
            </Button>
          </Space>
          {pinStatusBlock}
          {pinActions}
          {errors.longitude?.message && (
            <Text type="danger" className="block mb-12">
              {String(errors.longitude.message)}
            </Text>
          )}
        </>
      ),
    },
    {
      key: 'manual',
      label: (
        <span>
          <EditOutlined /> Manual Type
        </span>
      ),
      children: (
        <>
          <Text type="secondary" className="block mb-12">
            Type the location in your own words when GPS or a map link is not available.
          </Text>
          <Text type="secondary" className="block mb-4">
            Location description
          </Text>
          <Controller
            name="manualLocation"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
                rows={3}
                placeholder="e.g. Seselangen sual pang"
                maxLength={500}
                showCount
              />
            )}
          />
          {errors.manualLocation?.message && (
            <Text type="danger" className="block mt-4">
              {String(errors.manualLocation.message)}
            </Text>
          )}
        </>
      ),
    },
  ];

  return (
    <Card size="small" className="mb-16" title="Property Location">
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
      {activeTab !== 'manual' && <div className="mt-16">{deliveryNotesField}</div>}
    </Card>
  );
};
