import { Form, Input, InputNumber, Typography } from 'antd';
import type { InventoryItem } from '@/types';

interface InventoryItemFieldsProps {
  editing?: InventoryItem | null;
}

/** Stock identity fields only — category and cost live in the combined form modal. */
export const InventoryItemFields = ({ editing }: InventoryItemFieldsProps) => (
  <>
    <Form.Item name="name" label="Name" rules={[{ required: true }]}>
      <Input />
    </Form.Item>
    <Form.Item name="sku" label="SKU">
      <Input placeholder="Optional SKU" />
    </Form.Item>
    <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
      <Input placeholder="e.g. pcs, liters, bottles" />
    </Form.Item>
    <Form.Item name="description" label="Description">
      <Input.TextArea rows={2} placeholder="Optional description" />
    </Form.Item>
    {editing ? (
      <Form.Item label="Current Stock">
        <InputNumber value={editing.currentStock} disabled className="w-full" />
      </Form.Item>
    ) : (
      <>
        <Form.Item
          name="initialQuantity"
          label="Initial Quantity"
          extra="Optional starting stock. Recorded as production on create."
        >
          <InputNumber min={0} placeholder="0" className="w-full" />
        </Form.Item>
        <Typography.Text type="secondary" className="mb-16">
          Leave at 0 to add stock later via Production.
        </Typography.Text>
      </>
    )}
    <Form.Item name="lowStockThreshold" label="Low Stock Threshold">
      <InputNumber min={0} className="w-full" />
    </Form.Item>
  </>
);
