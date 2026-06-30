import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Space,
  Form,
  Switch,
  Upload,
  message,
  Popconfirm,
  Tag,
  Avatar,
  Divider,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LinkOutlined,
  MinusCircleOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray, type Resolver, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi, pricingTierApi } from '@/services/api';
import { BaseTable } from '@/components/BaseTable';
import { BaseModal } from '@/components/BaseModal';
import { PageHeader } from '@/components/PageHeader';
import { MobileListCard } from '@/components/MobileListCard';
import { CustomerLocationFields, type LocationTab } from '@/components/CustomerLocationFields';
import { usePagination } from '@/hooks/usePagination';
import { useSearchFromUrl } from '@/hooks/useSearchFromUrl';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterCustomerChange } from '@/utils/invalidateBusinessQueries';
import { formatCoordinates, getCustomerMapsUrl, hasValidCoordinates } from '@/utils/locationLink';
import type { Customer, PricingTier } from '@/types';

const { Text } = Typography;

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  mobile: z.string().min(10, 'Valid mobile is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

const customerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  pricingCategory: z.string().min(1, 'Pricing category is required'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  manualLocation: z.string().max(500).optional().or(z.literal('')),
  locationNotes: z.string().max(500).optional().or(z.literal('')),
  contacts: z.array(contactSchema).optional(),
  status: z.enum(['enabled', 'disabled']).optional(),
}).refine(
  (data) =>
    (data.latitude == null && data.longitude == null) ||
    (data.latitude != null && data.longitude != null),
  { message: 'Enter both latitude and longitude', path: ['longitude'] },
);

type CustomerForm = z.infer<typeof customerSchema>;

const getTierLabel = (tier: Customer['pricingCategory']) => {
  if (typeof tier === 'object' && tier !== null) return tier.label;
  return '—';
};

const getTierId = (tier: Customer['pricingCategory']) =>
  typeof tier === 'object' && tier !== null ? tier._id : String(tier);

export const CustomersPage = () => {
  const queryClient = useQueryClient();
  const { page, limit, onPageChange, reset } = usePagination();
  const { search, setSearch, debouncedSearch } = useSearchFromUrl();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | undefined>();
  const [locationTab, setLocationTab] = useState<LocationTab>('link');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, limit, debouncedSearch, statusFilter],
    queryFn: () =>
      customerApi.list({ page, limit, search: debouncedSearch, status: statusFilter }).then((r) => r.data),
  });

  const { data: tiersData } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => pricingTierApi.list().then((r) => r.data.data),
  });

  const tierOptions =
    tiersData?.map((t: PricingTier) => ({ label: t.label, value: t._id })) ?? [];

  const defaultTierId = tiersData?.[0]?._id ?? '';

  const {
    control,
    handleSubmit,
    reset: resetForm,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema) as Resolver<CustomerForm>,
    defaultValues: {
      fullName: '',
      address: '',
      phone: '',
      pricingCategory: '',
      latitude: undefined,
      longitude: undefined,
      manualLocation: '',
      locationNotes: '',
      contacts: [],
      status: 'enabled',
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'contacts' });

  const createMutation = useMutation({
    mutationFn: (data: CustomerForm) => customerApi.create(data),
    onSuccess: () => {
      message.success('Customer created');
      invalidateAfterCustomerChange(queryClient);
      closeModal();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to create customer')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) => customerApi.update(id, data),
    onSuccess: () => {
      message.success('Customer updated');
      invalidateAfterCustomerChange(queryClient);
      closeModal();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to update customer')),
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('photo', file);
      return customerApi.uploadPhoto(id, formData);
    },
    onSuccess: (res) => {
      message.success('Photo uploaded');
      setPhotoPreview(res.data.data.propertyPhotoUrl);
      invalidateAfterCustomerChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to upload photo')),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id: string) => customerApi.deletePhoto(id),
    onSuccess: () => {
      message.success('Photo removed');
      setPhotoPreview(undefined);
      invalidateAfterCustomerChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to remove photo')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerApi.delete(id),
    onSuccess: () => {
      message.success('Customer deleted');
      invalidateAfterCustomerChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to delete customer')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => customerApi.toggleStatus(id),
    onSuccess: () => invalidateAfterCustomerChange(queryClient),
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to update status')),
  });

  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');
  const watchedManualLocation = watch('manualLocation');

  const importMutation = useMutation({
    mutationFn: (customers: Partial<Customer>[]) => customerApi.import(customers),
    onSuccess: (res) => {
      message.success(`Imported ${res.data.data.imported} customers`);
      invalidateAfterCustomerChange(queryClient);
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to import customers')),
  });

  const openCreate = () => {
    setEditing(null);
    setPhotoPreview(undefined);
    setLocationTab('link');
    resetForm({
      fullName: '',
      address: '',
      phone: '',
      pricingCategory: defaultTierId,
      latitude: undefined,
      longitude: undefined,
      manualLocation: '',
      locationNotes: '',
      contacts: [],
      status: 'enabled',
    });
    setModalOpen(true);
  };

  const openEdit = (record: Customer) => {
    const hasPin = hasValidCoordinates(record.latitude, record.longitude);
    const legacyManual =
      !hasPin && !record.manualLocation?.trim() && record.locationNotes?.trim()
        ? record.locationNotes
        : '';

    setEditing(record);
    setPhotoPreview(record.propertyPhotoUrl);
    resetForm({
      fullName: record.fullName,
      address: record.address,
      phone: record.phone,
      pricingCategory: getTierId(record.pricingCategory),
      latitude: record.latitude,
      longitude: record.longitude,
      manualLocation: record.manualLocation ?? legacyManual,
      locationNotes: hasPin ? (record.locationNotes ?? '') : '',
      contacts: record.contacts ?? [],
      status: record.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setPhotoPreview(undefined);
  };

  const onSubmit = (formData: CustomerForm) => {
    if (locationTab === 'manual' && !formData.manualLocation?.trim()) {
      message.error('Enter a location description or choose another tab');
      return;
    }

    const hasPin = hasValidCoordinates(formData.latitude, formData.longitude);
    const usePin = locationTab !== 'manual' && hasPin;

    const payload = {
      ...formData,
      latitude: usePin ? formData.latitude : undefined,
      longitude: usePin ? formData.longitude : undefined,
      manualLocation:
        locationTab === 'manual' ? formData.manualLocation?.trim() || undefined : undefined,
      locationNotes:
        locationTab === 'manual' ? undefined : formData.locationNotes?.trim() || undefined,
      contacts: formData.contacts ?? [],
    };

    if (editing) updateMutation.mutate({ id: editing._id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleCSVImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1);
      const customers = lines
        .filter((l) => l.trim())
        .map((line) => {
          const [fullName, address, phone] = line.split(',');
          return { fullName: fullName?.trim(), address: address?.trim(), phone: phone?.trim() };
        });
      importMutation.mutate(customers);
    };
    reader.readAsText(file);
    return false;
  };

  const columns = [
    { title: 'Full Name', dataIndex: 'fullName', sorter: true },
    { title: 'Phone', dataIndex: 'phone' },
    { title: 'Address', dataIndex: 'address', ellipsis: true },
    {
      title: 'Pricing Category',
      dataIndex: 'pricingCategory',
      render: (tier: Customer['pricingCategory']) => <Tag>{getTierLabel(tier)}</Tag>,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: unknown, r: Customer) => {
        if (hasValidCoordinates(r.latitude, r.longitude)) {
          const mapsUrl = getCustomerMapsUrl(r);
          return (
            <Space direction="vertical" size={0}>
              <Text type="secondary" className="text-xs">
                {formatCoordinates(r.latitude, r.longitude)}
              </Text>
              {mapsUrl && (
                <Button type="link" size="small" icon={<LinkOutlined />} href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  Open Map
                </Button>
              )}
            </Space>
          );
        }
        if (r.manualLocation?.trim()) {
          return (
            <Text type="secondary" className="text-xs">
              {r.manualLocation}
            </Text>
          );
        }
        if (r.locationNotes?.trim()) {
          return (
            <Text type="secondary" className="text-xs">
              {r.locationNotes}
            </Text>
          );
        }
        return '—';
      },
    },
    {
      title: 'Photo',
      dataIndex: 'propertyPhotoUrl',
      render: (url: string) =>
        url ? <Avatar shape="square" size={40} src={url} alt="Property" /> : '—',
    },
    { title: 'Outstanding Slim', dataIndex: 'outstandingSlim', render: (v: number) => v ?? 0 },
    { title: 'Outstanding Round', dataIndex: 'outstandingRound', render: (v: number) => v ?? 0 },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string, r: Customer) => (
        <Switch
          checked={s === 'enabled'}
          onChange={() => toggleMutation.mutate(r._id)}
          checkedChildren="On"
          unCheckedChildren="Off"
        />
      ),
    },
    {
      title: 'Actions',
      render: (_: unknown, r: Customer) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Delete this customer?" onConfirm={() => deleteMutation.mutate(r._id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage your customer database"
        refreshQueryKeys={['customers', 'pricing-tiers']}
        extra={
          <div className="page-header__actions">
            <Upload beforeUpload={handleCSVImport} accept=".csv" showUploadList={false}>
              <Button icon={<UploadOutlined />} className="page-header__action-btn">
                Import CSV
              </Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="page-header__action-btn">
              Add Customer
            </Button>
          </div>
        }
      />

      <div className="filter-toolbar mb-16">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search customers..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            reset();
          }}
          className="w-280"
          allowClear
        />
        <Select
          placeholder="Status"
          allowClear
          className="w-140"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            reset();
          }}
          options={[
            { label: 'Enabled', value: 'enabled' },
            { label: 'Disabled', value: 'disabled' },
          ]}
        />
      </div>

      <BaseTable
        dataSource={data?.data}
        columns={columns}
        rowKey="_id"
        loading={isLoading}
        renderMobileItem={(record) => (
          <MobileListCard
            title={record.fullName}
            subtitle={record.phone}
            fields={[
              { label: 'Address', value: record.address },
              { label: 'Pricing', value: getTierLabel(record.pricingCategory) },
              {
                label: 'Status',
                value: (
                  <Switch
                    checked={record.status === 'enabled'}
                    onChange={() => toggleMutation.mutate(record._id)}
                    checkedChildren="On"
                    unCheckedChildren="Off"
                  />
                ),
              },
            ]}
            actions={
              <Space>
                <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} aria-label="Edit customer" />
                <Popconfirm title="Delete this customer?" onConfirm={() => deleteMutation.mutate(record._id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label="Delete customer" />
                </Popconfirm>
              </Space>
            }
          />
        )}
        pagination={{
          current: page,
          pageSize: limit,
          total: data?.pagination?.total,
          onChange: onPageChange,
        }}
      />

      <BaseModal
        title={editing ? 'Edit Customer' : 'Add Customer'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={handleSubmit(onSubmit)}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={720}
        scrollable
      >
        <Form layout="vertical">
          <Form.Item label="Full Name" validateStatus={errors.fullName ? 'error' : ''} help={errors.fullName?.message}>
            <Controller name="fullName" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>
          <Form.Item label="Address" validateStatus={errors.address ? 'error' : ''} help={errors.address?.message}>
            <Controller name="address" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
          </Form.Item>
          <Form.Item label="Phone" validateStatus={errors.phone ? 'error' : ''} help={errors.phone?.message}>
            <Controller name="phone" control={control} render={({ field }) => <Input {...field} />} />
          </Form.Item>

          <Divider plain>Pricing Category</Divider>
          <Form.Item
            label="Pricing Category"
            validateStatus={errors.pricingCategory ? 'error' : ''}
            help={errors.pricingCategory?.message}
          >
            <Controller
              name="pricingCategory"
              control={control}
              render={({ field }) => (
                <Select {...field} options={tierOptions} placeholder="Select pricing tier" loading={!tiersData} />
              )}
            />
          </Form.Item>

          <CustomerLocationFields
            key={editing?._id ?? 'new'}
            control={control as unknown as Control<Record<string, unknown>>}
            errors={errors as FieldErrors<Record<string, unknown>>}
            latitude={watchedLatitude}
            longitude={watchedLongitude}
            manualLocation={watchedManualLocation}
            resetKey={editing?._id ?? 'new'}
            onActiveTabChange={setLocationTab}
            setValue={setValue as unknown as UseFormSetValue<Record<string, unknown>>}
          />

          <Divider plain>Property Photo</Divider>
          <Form.Item label="Property Photo">
            {photoPreview ? (
              <Space direction="vertical">
                <Avatar shape="square" size={120} src={photoPreview} alt="Property" />
                {editing && (
                  <Space>
                    <Upload
                      showUploadList={false}
                      accept="image/*"
                      beforeUpload={(file) => {
                        photoMutation.mutate({ id: editing._id, file });
                        return false;
                      }}
                    >
                      <Button icon={<CameraOutlined />} loading={photoMutation.isPending}>
                        Replace Photo
                      </Button>
                    </Upload>
                    <Button danger onClick={() => deletePhotoMutation.mutate(editing._id)} loading={deletePhotoMutation.isPending}>
                      Remove
                    </Button>
                  </Space>
                )}
              </Space>
            ) : editing ? (
              <Upload
                showUploadList={false}
                accept="image/*"
                beforeUpload={(file) => {
                  photoMutation.mutate({ id: editing._id, file });
                  return false;
                }}
              >
                <Button icon={<CameraOutlined />} loading={photoMutation.isPending}>
                  Upload Photo
                </Button>
              </Upload>
            ) : (
              <span className="text-secondary">Save the customer first to upload a photo.</span>
            )}
          </Form.Item>

          <Divider plain>Contacts</Divider>
          {fields.map((field, index) => (
            <Space key={field.id} align="start" className="mb-12 w-full" wrap>
              <Form.Item label="Name" className="mb-0">
                <Controller
                  name={`contacts.${index}.name`}
                  control={control}
                  render={({ field: f }) => <Input {...f} placeholder="Name" />}
                />
              </Form.Item>
              <Form.Item label="Position" className="mb-0">
                <Controller
                  name={`contacts.${index}.position`}
                  control={control}
                  render={({ field: f }) => <Input {...f} placeholder="Position" />}
                />
              </Form.Item>
              <Form.Item label="Mobile" className="mb-0">
                <Controller
                  name={`contacts.${index}.mobile`}
                  control={control}
                  render={({ field: f }) => <Input {...f} placeholder="Mobile" />}
                />
              </Form.Item>
              <Form.Item label="Email" className="mb-0">
                <Controller
                  name={`contacts.${index}.email`}
                  control={control}
                  render={({ field: f }) => <Input {...f} placeholder="Email" />}
                />
              </Form.Item>
              <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(index)} className="mt-28" />
            </Space>
          ))}
          <Button type="dashed" onClick={() => append({ name: '', mobile: '', position: '', email: '' })} block icon={<PlusOutlined />}>
            Add Contact
          </Button>
        </Form>
      </BaseModal>
    </div>
  );
};
