import { useEffect } from 'react';
import { Form, Select, Switch, Divider, Typography, message, InputNumber } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, productApi, pricingTierApi } from '@/services/api';
import { BaseModal } from '@/components/BaseModal';
import { InventoryItemFields } from '@/components/InventoryItemFields';
import { ProductPricingFields } from '@/components/ProductPricingFields';
import { getApiErrorMessage } from '@/utils/apiError';
import type { InventoryItem, Product } from '@/types';

const PRODUCT_CATEGORY_OPTIONS = [
  { label: 'Refill', value: 'refill' },
  { label: 'Container', value: 'container' },
  { label: 'Rental', value: 'rental' },
  { label: 'Other', value: 'other' },
];

const isProductCategory = (value: string): value is Product['category'] =>
  PRODUCT_CATEGORY_OPTIONS.some((o) => o.value === value);

export type InventoryItemFormValues = {
  name: string;
  sku?: string;
  unit: string;
  category: Product['category'];
  price: number;
  description?: string;
  initialQuantity?: number;
  lowStockThreshold: number;
  decrementsStock: boolean;
  tierBPrice?: number;
  tierCPrice?: number;
  catalogPrice: number;
  catalogStatus: Product['status'];
};

const defaultFormValues: Partial<InventoryItemFormValues> = {
  name: '',
  sku: '',
  unit: 'pcs',
  category: 'refill',
  price: 0,
  description: '',
  lowStockThreshold: 10,
  decrementsStock: true,
  catalogPrice: 0,
  catalogStatus: 'active',
};

interface InventoryItemFormModalProps {
  open: boolean;
  onClose: () => void;
  editing?: InventoryItem | null;
  onSuccess?: (item: InventoryItem) => void;
}

export const InventoryItemFormModal = ({
  open,
  onClose,
  editing,
  onSuccess,
}: InventoryItemFormModalProps) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<InventoryItemFormValues>();
  const category = Form.useWatch('category', form);

  const { data: pricingTiers } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => pricingTierApi.list().then((r) => r.data.data),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;

    const loadForm = async () => {
      if (!editing) {
        form.setFieldsValue(defaultFormValues);
        return;
      }

      if (editing.linkedProduct?._id) {
        try {
          const productRes = await productApi.get(editing.linkedProduct._id);
          const product = productRes.data.data;
          form.setFieldsValue({
            ...defaultFormValues,
            name: editing.name,
            sku: editing.sku,
            unit: editing.unit,
            category: product.category,
            price: product.purchasePrice ?? editing.price ?? 0,
            description: editing.description,
            lowStockThreshold: editing.lowStockThreshold,
            decrementsStock: product.decrementsStock,
            tierBPrice: product.tierBPrice,
            tierCPrice: product.tierCPrice,
            catalogPrice: product.price,
            catalogStatus: product.status,
          });
          return;
        } catch {
          // fall through to inventory-only defaults
        }
      }

      form.setFieldsValue({
        ...defaultFormValues,
        name: editing.name,
        sku: editing.sku,
        unit: editing.unit,
        category: isProductCategory(editing.category) ? editing.category : 'other',
        price: editing.price ?? 0,
        description: editing.description,
        lowStockThreshold: editing.lowStockThreshold,
        catalogPrice: editing.price ?? 0,
      });
    };

    loadForm();
  }, [open, editing, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: InventoryItemFormValues) => {
      const {
        category: itemCategory,
        decrementsStock,
        tierBPrice,
        tierCPrice,
        catalogPrice,
        catalogStatus,
        initialQuantity,
        price,
        ...rest
      } = values;

      const inventoryPayload = {
        ...rest,
        category: itemCategory,
        price,
        initialQuantity,
      };

      let inventoryItem: InventoryItem;
      if (editing) {
        const res = await inventoryApi.update(editing.publicId, inventoryPayload);
        inventoryItem = res.data.data;
      } else {
        const res = await inventoryApi.create(inventoryPayload);
        inventoryItem = res.data.data;
      }

      const linkedProductId = editing?.linkedProduct?._id;
      const productPayload: Partial<Product> = {
        name: values.name,
        price: catalogPrice ?? 0,
        purchasePrice: price,
        tierBPrice,
        tierCPrice,
        category: itemCategory,
        decrementsStock: decrementsStock ?? itemCategory === 'refill',
        linkedInventoryId: inventoryItem._id,
        status: catalogStatus ?? 'active',
      };

      if (linkedProductId) {
        await productApi.update(linkedProductId, productPayload);
      } else {
        await productApi.create(productPayload);
      }

      return inventoryItem;
    },
    onSuccess: (item) => {
      message.success(editing ? 'Updated' : 'Created');
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'not-in-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'active'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess?.(item);
      onClose();
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to save item')),
  });

  const handleCategoryChange = (value: Product['category']) => {
    if (value === 'refill') {
      form.setFieldsValue({ decrementsStock: true, category: value });
    } else if (value === 'rental' || value === 'container') {
      form.setFieldsValue({ decrementsStock: false, category: value });
    } else {
      form.setFieldsValue({ category: value });
    }
  };

  return (
    <BaseModal
      title={editing ? 'Edit Item' : 'Add Item'}
      open={open}
      onCancel={onClose}
      onOk={() => form.validateFields().then((v) => saveMutation.mutate(v))}
      confirmLoading={saveMutation.isPending}
      width={560}
      scrollable
    >
      <Form form={form} layout="vertical" initialValues={defaultFormValues}>
        <Typography.Title level={5} className="mt-0 mb-0">
          Item details
        </Typography.Title>
        <Typography.Text type="secondary" className="block mb-16">
          Stock identity and catalog settings shared for inventory and Walk-In sales.
        </Typography.Text>

        <InventoryItemFields editing={editing} />

        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select options={PRODUCT_CATEGORY_OPTIONS} onChange={handleCategoryChange} />
        </Form.Item>

        <Form.Item
          name="price"
          label="Cost / base price"
          extra="Your cost for this item. Also saved as purchase price on the catalog product."
        >
          <InputNumber min={0} precision={2} prefix="₱" className="w-full" />
        </Form.Item>

        <Divider />

        <ProductPricingFields tiers={pricingTiers} retailFieldName="catalogPrice" hidePurchasePrice />

        <Form.Item
          name="decrementsStock"
          label="Affect Item stock count"
          valuePropName="checked"
          extra={
            category === 'refill'
              ? 'Refill products decrease inventory when sold.'
              : 'Containers and rentals usually do not affect item stock.'
          }
        >
          <Switch />
        </Form.Item>

        <Form.Item name="catalogStatus" label="Catalog Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: 'Active — visible on Walk-In', value: 'active' },
              { label: 'Disabled — hidden from Walk-In', value: 'disabled' },
            ]}
          />
        </Form.Item>

        <Typography.Text type="secondary" className="text-sm">
          Disabled products are hidden from the sale screen but kept for transaction history.
        </Typography.Text>
      </Form>
    </BaseModal>
  );
};
