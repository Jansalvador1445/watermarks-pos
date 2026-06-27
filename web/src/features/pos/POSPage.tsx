import { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  InputNumber,
  Select,
  Form,
  Divider,
  message,
  List,
  Typography,
  Tabs,
  Spin,
  Empty,
  Tag,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ShoppingCartOutlined, HistoryOutlined, AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionApi, productApi, customerApi } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { SalesHistory } from '@/features/pos/SalesHistory';
import { ProductCatalog } from '@/features/pos/ProductCatalog';
import { formatCurrency } from '@/utils/formatters';
import { getApiErrorMessage } from '@/utils/apiError';
import { invalidateAfterTransactionChange } from '@/utils/invalidateBusinessQueries';
import { PAYMENT_METHODS } from '@/utils/constants';
import { useAuthStore } from '@/store/authStore';
import { getProductStockLabel } from '@/utils/productStock';
import {
  getCustomerTierCode,
  getCustomerTierLabel,
  getProductPriceForTier,
} from '@/utils/productPricing';
import type { Customer, Product } from '@/types';

const { Text, Title } = Typography;

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  decrementsStock: boolean;
  stockLabel?: string | null;
}

export const POSPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('sale');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saleType, setSaleType] = useState<'pos' | 'walkin'>('pos');
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'active'],
    queryFn: () => productApi.active().then((r) => r.data.data),
  });

  const { data: customersResponse } = useQuery({
    queryKey: ['customers', 'pos-picker'],
    queryFn: () => customerApi.list({ page: 1, limit: 200, status: 'enabled' }).then((r) => r.data.data),
  });

  const products = productsResponse ?? [];
  const customers = customersResponse ?? [];

  const selectedCustomer = useMemo(
    () => customers.find((c: Customer) => c._id === selectedCustomerId),
    [customers, selectedCustomerId],
  );
  const activeTierCode = getCustomerTierCode(selectedCustomer);
  const activeTierLabel = selectedCustomer ? getCustomerTierLabel(selectedCustomer) : 'Retail';

  const resolveUnitPrice = (product: Product) => getProductPriceForTier(product, activeTierCode);

  useEffect(() => {
    if (cart.length === 0 || products.length === 0) return;
    setCart((current) =>
      current.map((item) => {
        const product = products.find((p) => p._id === item.productId);
        if (!product) return item;
        return { ...item, price: resolveUnitPrice(product) };
      }),
    );
  }, [activeTierCode, products]);

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const maxDiscount = subtotal;
  const safeDiscount = Math.min(Math.max(0, discount), maxDiscount);
  const total = subtotal - safeDiscount;

  const createMutation = useMutation({
    mutationFn: () =>
      transactionApi.create({
        type: saleType,
        customerId: selectedCustomerId,
        customerName: customerName || 'Walk-in',
        items: cart.map(({ productId, quantity }) => ({ productId, quantity })),
        paymentMethod,
        discount: safeDiscount,
      }),
    onSuccess: () => {
      const stockLines = cart.filter((i) => i.decrementsStock && i.stockLabel);
      if (stockLines.length > 0) {
        message.success(
          `Sale completed. Stock decreased: ${stockLines.map((i) => `${i.name} → ${i.stockLabel} (×${i.quantity})`).join(', ')}.`,
        );
      } else {
        message.success('Sale completed. No filled water stock change (containers/rentals only).');
      }
      setCart([]);
      setDiscount(0);
      setCustomerName('');
      setSelectedCustomerId(undefined);
      invalidateAfterTransactionChange(queryClient);
      setActiveTab('history');
    },
    onError: (error) => message.error(getApiErrorMessage(error, 'Failed to complete sale')),
  });

  const addToCart = (product: Product) => {
    const unitPrice = resolveUnitPrice(product);
    const existing = cart.find((c) => c.productId === product._id);
    if (existing) {
      setCart(cart.map((c) => (c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.name,
          price: unitPrice,
          quantity: 1,
          decrementsStock: product.decrementsStock,
          stockLabel: getProductStockLabel(product),
        },
      ]);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      setCart(cart.map((item, i) => (i === index ? { ...item, quantity } : item)));
    }
  };

  const cartStockUnits = cart
    .filter((i) => i.decrementsStock && i.stockLabel)
    .reduce((sum, i) => sum + i.quantity, 0);

  const newSaleContent = (
    <Row gutter={24}>
      <Col xs={24} lg={14}>
        <Card
          title="Products"
          bordered={false}
          className="card-rounded pos-panel-card"
          extra={
            isAdmin ? (
              <Button type="link" icon={<SettingOutlined />} onClick={() => setActiveTab('products')}>
                Manage Catalog
              </Button>
            ) : null
          }
        >
          {productsLoading ? (
            <div className="flex-center p-24">
              <Spin />
            </div>
          ) : products.length === 0 ? (
            <Empty
              description={
                isAdmin
                  ? 'No products yet. Add products in the Product Catalog tab.'
                  : 'No products available. Ask an admin to add products.'
              }
            >
              {isAdmin ? (
                <Button type="primary" onClick={() => setActiveTab('products')}>
                  Open Product Catalog
                </Button>
              ) : null}
            </Empty>
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                className="mb-12"
                message={`Pricing: ${activeTierLabel}${selectedCustomer ? ` — ${selectedCustomer.fullName}` : ' (walk-in)'}`}
                description="Select a registered customer to apply Wholesale or Special product prices. Deliveries use separate gallon rates from Settings."
              />
            <Row gutter={[12, 12]}>
              {products.map((product) => (
                <Col xs={12} sm={8} key={product._id}>
                  <Card hoverable size="small" onClick={() => addToCart(product)} className="pos-product-card">
                    <ShoppingCartOutlined className="icon-md icon-mb" />
                    <div className="pos-product-name">{product.name}</div>
                    <Text type="secondary">{formatCurrency(resolveUnitPrice(product))}</Text>
                    {product.decrementsStock && getProductStockLabel(product) ? (
                      <div className="mt-4">
                        <Tag color="blue" className="text-xs">
                          Refill · {getProductStockLabel(product)} stock
                        </Tag>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <Tag className="text-xs">No stock change</Tag>
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
            </>
          )}
        </Card>
      </Col>

      <Col xs={24} lg={10}>
        <Card title="Current Sale" bordered={false} className="card-rounded pos-panel-card">
          <Form layout="vertical">
            <Form.Item
              label="Customer"
              extra="Walk-in uses Retail pricing. Select a customer to apply their Wholesale or Special tier."
            >
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Walk-in (Retail pricing)"
                value={selectedCustomerId}
                options={customers.map((c: Customer) => ({
                  value: c._id,
                  label: `${c.fullName} · ${getCustomerTierLabel(c)}`,
                }))}
                onChange={(id) => {
                  setSelectedCustomerId(id);
                  const customer = customers.find((c: Customer) => c._id === id);
                  setCustomerName(customer?.fullName ?? '');
                }}
              />
            </Form.Item>
          </Form>

          <List
            dataSource={cart}
            locale={{ emptyText: 'No items in cart' }}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <InputNumber
                    min={1}
                    value={item.quantity}
                    onChange={(v) => updateQuantity(index, v || 0)}
                    size="small"
                  />,
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => updateQuantity(index, 0)} />,
                ]}
              >
                <List.Item.Meta
                  title={item.name}
                  description={
                    <>
                      {formatCurrency(item.price)}
                      {item.decrementsStock && item.stockLabel ? (
                        <Tag color="blue" className="ml-8 text-xs">
                          −{item.stockLabel}
                        </Tag>
                      ) : null}
                    </>
                  }
                />
                <Text strong>{formatCurrency(item.quantity * item.price)}</Text>
              </List.Item>
            )}
          />

          <Divider />

          <div className="summary-row mb-8">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex-between flex-align-center mb-8">
            <span>Discount</span>
            <InputNumber
              min={0}
              max={maxDiscount}
              value={safeDiscount}
              onChange={(v) => setDiscount(Math.min(v || 0, maxDiscount))}
              prefix="₱"
              size="small"
            />
          </div>
          <div className="flex-between mb-16">
            <Title level={4} className="m-0">
              Total
            </Title>
            <Title level={4} className="m-0 text-primary">
              {formatCurrency(total)}
            </Title>
          </div>

          <Form.Item label="Payment Method">
            <Select value={paymentMethod} onChange={setPaymentMethod} options={PAYMENT_METHODS} />
          </Form.Item>

          <Form.Item
            label="Sale Type"
            extra="Both POS and Walk-in decrease filled water stock for Refill products after payment is completed."
          >
            <Select
              value={saleType}
              onChange={setSaleType}
              options={[
                { label: 'POS Sale', value: 'pos' },
                { label: 'Walk-in Sale', value: 'walkin' },
              ]}
            />
          </Form.Item>

          {cartStockUnits > 0 && (
            <Alert
              type="warning"
              showIcon
              className="mb-12"
              message={`This sale will decrease filled water stock by ${cartStockUnits} unit(s) when completed.`}
            />
          )}

          <Button
            type="primary"
            block
            size="large"
            icon={<PlusOutlined />}
            disabled={cart.length === 0}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Complete Sale — {formatCurrency(total)}
          </Button>
        </Card>
      </Col>
    </Row>
  );

  const tabItems = [
    {
      key: 'sale',
      label: (
        <span className="pos-page-tabs__label">
          <ShoppingCartOutlined />
          New Sale
        </span>
      ),
      children: newSaleContent,
    },
    {
      key: 'history',
      label: (
        <span className="pos-page-tabs__label">
          <HistoryOutlined />
          Sales History
        </span>
      ),
      children: <SalesHistory />,
    },
  ];

  if (isAdmin) {
    tabItems.push({
      key: 'products',
      label: (
        <span className="pos-page-tabs__label">
          <AppstoreOutlined />
          Product Catalog
        </span>
      ),
      children: <ProductCatalog />,
    });
  }

  return (
    <div>
      <PageHeader
        title="POS Sales"
        subtitle={
          isAdmin
            ? 'Point of sale for walk-in customers · manage products in the Product Catalog tab'
            : 'Point of sale for walk-in customers'
        }
        refreshQueryKeys={['products', 'pos-sales', 'transactions']}
      />

      <Card bordered={false} className="card-rounded pos-page-tabs">
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="pos-page-tabs__nav" items={tabItems} />
      </Card>
    </div>
  );
};
