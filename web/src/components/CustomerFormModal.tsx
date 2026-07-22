import { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Select,
  Space,
  Form,
  Upload,
  message,
  Avatar,
  Divider,
  Alert,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined, CameraOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useForm,
  Controller,
  useFieldArray,
  type Resolver,
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customerApi, pricingTierApi } from '@/services/api';
import { BaseModal } from '@/components/BaseModal';
import { CustomerLocationFields, type LocationTab } from '@/components/CustomerLocationFields';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterCustomerChange } from '@/utils/invalidateBusinessQueries';
import { hasValidCoordinates } from '@/utils/locationLink';
import { buildTierOptions } from '@/utils/pricingTier';
import type { Customer } from '@/types';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  position: z.string().optional(),
  mobile: z.string().min(10, 'Valid mobile is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

const customerSchema = z
  .object({
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
  })
  .refine(
    (data) =>
      (data.latitude == null && data.longitude == null) ||
      (data.latitude != null && data.longitude != null),
    { message: 'Enter both latitude and longitude', path: ['longitude'] },
  );

type CustomerForm = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: Customer | null;
  onSuccess?: (customer: Customer) => void;
}

export const CustomerFormModal = ({
  open,
  onClose,
  editing = null,
  onSuccess,
}: CustomerFormModalProps) => {
  const queryClient = useQueryClient();
  const [photoPreview, setPhotoPreview] = useState<string | undefined>();
  const [locationTab, setLocationTab] = useState<LocationTab>('link');

  const {
    data: tiersData,
    isLoading: tiersLoading,
    isError: tiersError,
  } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => pricingTierApi.list().then((r) => r.data.data),
    enabled: open,
  });

  const tierOptions = buildTierOptions(tiersData);
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
  const watchedPricingCategory = watch('pricingCategory');
  const watchedLatitude = watch('latitude');
  const watchedLongitude = watch('longitude');
  const watchedManualLocation = watch('manualLocation');

  useEffect(() => {
    if (!open) return;

    if (editing) {
      const hasPin = hasValidCoordinates(editing.latitude, editing.longitude);
      const legacyManual =
        !hasPin && !editing.manualLocation?.trim() && editing.locationNotes?.trim()
          ? editing.locationNotes
          : '';

      setPhotoPreview(editing.propertyPhotoUrl);
      setLocationTab('link');
      resetForm({
        fullName: editing.fullName,
        address: editing.address,
        phone: editing.phone,
        pricingCategory:
          typeof editing.pricingCategory === 'object' && editing.pricingCategory !== null
            ? editing.pricingCategory._id
            : String(editing.pricingCategory),
        latitude: editing.latitude,
        longitude: editing.longitude,
        manualLocation: editing.manualLocation ?? legacyManual,
        locationNotes: hasPin ? (editing.locationNotes ?? '') : '',
        contacts: editing.contacts ?? [],
        status: editing.status,
      });
      return;
    }

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
  }, [open, editing, resetForm, defaultTierId]);

  useEffect(() => {
    if (!open || editing || !defaultTierId) return;
    if (!watchedPricingCategory) {
      setValue('pricingCategory', defaultTierId);
    }
  }, [open, editing, defaultTierId, watchedPricingCategory, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: CustomerForm) => customerApi.create(data),
    onSuccess: (res) => {
      message.success('Customer created');
      invalidateAfterCustomerChange(queryClient);
      onSuccess?.(res.data.data);
      onClose();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to create customer')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerForm }) => customerApi.update(id, data),
    onSuccess: (res) => {
      message.success('Customer updated');
      invalidateAfterCustomerChange(queryClient);
      onSuccess?.(res.data.data);
      onClose();
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

  const tiersUnavailable = tiersError || (!tiersLoading && tierOptions.length === 0);

  return (
    <BaseModal
      title={editing ? 'Edit Customer' : 'Add Customer'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit(onSubmit)}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      width={720}
      scrollable
    >
      <Form layout="vertical">
        {tiersUnavailable && (
          <Alert
            type="warning"
            showIcon
            className="mb-16"
            message="Pricing tiers not configured"
            description="Contact an administrator to set up Category A–C pricing tiers."
          />
        )}

        <Form.Item
          label="Full Name"
          validateStatus={errors.fullName ? 'error' : ''}
          help={errors.fullName?.message}
        >
          <Controller name="fullName" control={control} render={({ field }) => <Input {...field} />} />
        </Form.Item>
        <Form.Item
          label="Address"
          validateStatus={errors.address ? 'error' : ''}
          help={errors.address?.message}
        >
          <Controller
            name="address"
            control={control}
            render={({ field }) => <Input.TextArea {...field} rows={2} />}
          />
        </Form.Item>
        <Form.Item
          label="Phone"
          validateStatus={errors.phone ? 'error' : ''}
          help={errors.phone?.message}
        >
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
              <Select
                {...field}
                value={field.value || undefined}
                options={tierOptions}
                placeholder="Select pricing tier"
                loading={tiersLoading}
                notFoundContent={
                  tiersUnavailable ? 'No pricing tiers available' : 'No tiers found'
                }
              />
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
                  <Button
                    danger
                    onClick={() => deletePhotoMutation.mutate(editing._id)}
                    loading={deletePhotoMutation.isPending}
                  >
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
            <Button
              type="text"
              danger
              icon={<MinusCircleOutlined />}
              onClick={() => remove(index)}
              className="mt-28"
            />
          </Space>
        ))}
        <Button
          type="dashed"
          onClick={() => append({ name: '', mobile: '', position: '', email: '' })}
          block
          icon={<PlusOutlined />}
        >
          Add Contact
        </Button>
      </Form>
    </BaseModal>
  );
};
