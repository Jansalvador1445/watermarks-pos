import { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Switch, Button, message, Typography, Alert, Divider, Tag, Space } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, pricingTierApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { getApiErrorMessage } from '@/utils/apiError';
import { useAuthStore } from '@/store/authStore';
import type { PricingTier, Settings } from '@/types';

const { Title, Text } = Typography;

type TierFormValues = Record<string, { slimPrice: number; roundPrice: number }>;

const TIER_DESCRIPTIONS: Record<string, string> = {
  tier_a: 'Retail customers',
  tier_b: 'Wholesale customers',
  tier_c: 'Special customers',
};

export const SettingsPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [form] = Form.useForm();
  const [tierForm] = Form.useForm<TierFormValues>();

  const { isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      settingsApi.get().then((r) => {
        form.setFieldsValue(r.data.data);
        return r.data.data;
      }),
  });

  const { data: tiers = [], isLoading: tiersLoading } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: () => pricingTierApi.list().then((r) => r.data.data),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!tiers.length) return;
    const values: TierFormValues = {};
    for (const tier of tiers) {
      values[tier._id] = { slimPrice: tier.slimPrice, roundPrice: tier.roundPrice };
    }
    tierForm.setFieldsValue(values);
  }, [tiers, tierForm]);

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Settings>) => settingsApi.update(values),
    onSuccess: () => {
      message.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const tierUpdateMutation = useMutation({
    mutationFn: async (values: TierFormValues) => {
      const updates = Object.entries(values).map(([id, prices]) =>
        pricingTierApi.update(id, prices),
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      message.success('Delivery tier prices saved');
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to update pricing tiers')),
  });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your system preferences" refreshQueryKeys={['settings', 'pricing-tiers']} />

      <Card bordered={false} className="card-rounded mb-24" loading={isLoading}>
        <Form form={form} layout="vertical" onFinish={(v) => updateMutation.mutate(v)}>
          <Title level={5}>Company</Title>
          <Form.Item name="companyName" label="Company Name">
            <Input />
          </Form.Item>
          <Form.Item name="logo" label="Logo URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <Title level={5}>Default Pricing (legacy fallback)</Title>
          <Form.Item name={['pricing', 'defaultSlimPrice']} label="Default Slim Price">
            <InputNumber min={0} prefix="₱" className="w-full" />
          </Form.Item>
          <Form.Item name={['pricing', 'defaultRoundPrice']} label="Default Round Price">
            <InputNumber min={0} prefix="₱" className="w-full" />
          </Form.Item>

          <Title level={5}>Delivery Rules</Title>
          <Form.Item name={['deliveryRules', 'overdueDaysOrange']} label="Orange Alert (days)">
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Form.Item name={['deliveryRules', 'overdueDaysRed']} label="Red Alert (days)">
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Title level={5}>Notifications</Title>
          <Form.Item name={['notificationSettings', 'overdueDelivery']} label="Overdue Delivery Alerts" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['notificationSettings', 'lowInventory']} label="Low Inventory Alerts" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['notificationSettings', 'backupReminder']} label="Backup Reminders" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['notificationSettings', 'paymentReminder']} label="Payment Reminders" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
            Save Settings
          </Button>
        </Form>
      </Card>

      {isAdmin && (
        <Card bordered={false} className="card-rounded mb-24" loading={tiersLoading} title="Customer Pricing Tiers">
          <Alert
            type="info"
            showIcon
            className="mb-16"
            message="Two places to set prices"
            description={
              <>
                <strong>POS → Catalog</strong> — set retail / wholesale / special prices <em>per product</em> (for POS sales).
                <br />
                <strong>Below</strong> — slim &amp; round gallon rates per customer tier (for deliveries &amp; collection).
              </>
            }
          />

          <Text type="secondary" className="block mb-16">
            Assign each customer a tier on the Customers page. Delivery billing uses the slim and round rates below.
          </Text>

          <Form form={tierForm} layout="vertical" onFinish={(values) => tierUpdateMutation.mutate(values)}>
            <div className="pricing-panel">
              {tiers.map((tier: PricingTier, index) => (
                <div key={tier._id}>
                  <Space className="mb-8">
                    <Text strong>{tier.label}</Text>
                    <Tag color="blue">{tier.code.replace('tier_', 'Tier ').toUpperCase()}</Tag>
                    <Text type="secondary">{TIER_DESCRIPTIONS[tier.code] ?? ''}</Text>
                  </Space>
                  <Space wrap align="start">
                    <Form.Item
                      name={[tier._id, 'slimPrice']}
                      label="Slim gallon (₱)"
                      rules={[{ required: true, type: 'number', min: 0 }]}
                    >
                      <InputNumber min={0} prefix="₱" />
                    </Form.Item>
                    <Form.Item
                      name={[tier._id, 'roundPrice']}
                      label="Round gallon (₱)"
                      rules={[{ required: true, type: 'number', min: 0 }]}
                    >
                      <InputNumber min={0} prefix="₱" />
                    </Form.Item>
                  </Space>
                  {index < tiers.length - 1 && <Divider className="my-8" />}
                </div>
              ))}
            </div>

            <Button type="primary" htmlType="submit" loading={tierUpdateMutation.isPending} className="mt-16">
              Save delivery tier prices
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
};
