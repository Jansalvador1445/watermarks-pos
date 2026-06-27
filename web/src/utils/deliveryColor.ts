import dayjs from 'dayjs';

export type DeliveryColorCode = 'white' | 'orange' | 'red';

export const getDaysPastDue = (deliveryDate: string | Date): number => {
  const scheduled = dayjs(deliveryDate).startOf('day');
  const today = dayjs().startOf('day');
  return Math.max(0, today.diff(scheduled, 'day'));
};

export const resolveDeliveryColorCode = (
  status: string,
  deliveryDate: string | Date,
  storedColorCode?: string,
): DeliveryColorCode => {
  if (status === 'delivered') return 'white';

  const daysPastDue = getDaysPastDue(deliveryDate);
  if (daysPastDue >= 3) return 'red';
  if (daysPastDue >= 2) return 'orange';

  if (status === 'overdue' && storedColorCode === 'orange') return 'orange';
  if (status === 'overdue' && storedColorCode === 'red') return 'red';

  return 'white';
};

export const getColorCodeLabel = (colorCode: string): string => {
  const labels: Record<string, string> = {
    white: 'On schedule',
    orange: 'Overdue 2 days',
    red: 'Overdue 3+ days',
  };
  return labels[colorCode] || 'On schedule';
};
