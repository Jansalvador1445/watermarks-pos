import { Form, InputNumber, Tag, Typography } from 'antd';
import { getTierSellingLabel, sortPricingTiers } from '@/utils/productPricing';
import type { PricingTier } from '@/types';

const { Text, Title } = Typography;

interface ProductPricingFieldsProps {
  tiers?: PricingTier[];
}

export const ProductPricingFields = ({ tiers = [] }: ProductPricingFieldsProps) => {
  const sortedTiers = sortPricingTiers(tiers);
  const tierA = sortedTiers.find((t) => t.code === 'tier_a') ?? sortedTiers[0];
  const tierB = sortedTiers.find((t) => t.code === 'tier_b') ?? sortedTiers[1];
  const tierC = sortedTiers.find((t) => t.code === 'tier_c') ?? sortedTiers[2];

  const retailLabel = tierA ? getTierSellingLabel(tierA.code, tierA.label) : 'Retail Price';
  const wholesaleLabel = tierB ? getTierSellingLabel(tierB.code, tierB.label) : 'Wholesale Price';
  const specialLabel = tierC ? getTierSellingLabel(tierC.code, tierC.label) : 'Special Price';

  return (
    <>
      <Title level={5} className="mb-0">
        Pricing
      </Title>
      <Text type="secondary" className="block mb-16">
        Set your cost first, then define selling prices for retail, wholesale, and special customers.
      </Text>

      <Form.Item name="purchasePrice" label="Purchase price (cost)">
        <InputNumber min={0} precision={2} prefix="₱" className="w-full" placeholder="0" />
      </Form.Item>

      <Title level={5} className="mb-0 mt-8">
        Selling prices
      </Title>
      <Text type="secondary" className="block mb-12">
        Retail price is required. Wholesale and special prices are optional for different customer tiers.
      </Text>

      <div className="pricing-panel">
        <Form.Item
          name="price"
          label={
            <span>
              {retailLabel}{' '}
              <Tag color="blue">{tierA?.label ?? 'Tier A'} · Required</Tag>
            </span>
          }
          rules={[{ required: true, type: 'number', min: 0, message: 'Enter a retail price' }]}
        >
          <InputNumber min={0} precision={2} prefix="₱" className="w-full" placeholder="0" />
        </Form.Item>

        <Form.Item
          name="tierBPrice"
          label={
            <span>
              {wholesaleLabel}{' '}
              <Tag>{tierB?.label ?? 'Tier B'} · Optional</Tag>
            </span>
          }
        >
          <InputNumber min={0} precision={2} prefix="₱" className="w-full" placeholder="Optional" />
        </Form.Item>

        <Form.Item
          name="tierCPrice"
          label={
            <span>
              {specialLabel}{' '}
              <Tag>{tierC?.label ?? 'Tier C'} · Optional</Tag>
            </span>
          }
          className="mb-0"
        >
          <InputNumber min={0} precision={2} prefix="₱" className="w-full" placeholder="Optional" />
        </Form.Item>
      </div>
    </>
  );
};
