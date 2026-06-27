import type { QueryClient } from '@tanstack/react-query';

const invalidateKeys = (queryClient: QueryClient, keys: string[]) => {
  keys.forEach((key) => {
    void queryClient.invalidateQueries({ queryKey: [key] });
  });
};

export const invalidateAfterCustomerChange = (queryClient: QueryClient) => {
  invalidateKeys(queryClient, ['customers', 'customers-select', 'dashboard']);
};

export const invalidateAfterDeliveryChange = (queryClient: QueryClient) => {
  invalidateKeys(queryClient, [
    'deliveries',
    'dashboard',
    'inventory',
    'inventory-movements',
    'customers',
    'logs',
  ]);
};

export const invalidateAfterTransactionChange = (queryClient: QueryClient) => {
  invalidateKeys(queryClient, [
    'transactions',
    'pos-sales',
    'dashboard',
    'inventory',
    'inventory-movements',
    'logs',
  ]);
};

export const invalidateAfterInvoiceChange = (queryClient: QueryClient) => {
  invalidateKeys(queryClient, ['invoices', 'water-orders', 'deliveries', 'dashboard', 'customers']);
};

/** @deprecated use invalidateAfterInvoiceChange */
export const invalidateAfterWaterOrderChange = invalidateAfterInvoiceChange;
