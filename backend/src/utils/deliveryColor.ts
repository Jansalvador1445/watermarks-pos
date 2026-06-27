import dayjs from 'dayjs';

export type DeliveryColorCode = 'white' | 'orange' | 'red';
export type DeliveryStatus = 'pending' | 'delivered' | 'overdue';

export const getDaysPastDue = (deliveryDate: Date | string): number => {
  const scheduled = dayjs(deliveryDate).startOf('day');
  const today = dayjs().startOf('day');
  return Math.max(0, today.diff(scheduled, 'day'));
};

/** Color dot: white = on schedule, orange = 2 days overdue, red = 3+ days overdue */
export const computeDeliveryColorCode = (
  status: string,
  deliveryDate: Date | string,
): DeliveryColorCode => {
  if (status === 'delivered') return 'white';

  const daysPastDue = getDaysPastDue(deliveryDate);
  if (daysPastDue >= 3) return 'red';
  if (daysPastDue >= 2) return 'orange';
  return 'white';
};

export const resolveDeliveryState = (
  status: string,
  deliveryDate: Date | string,
): { status: DeliveryStatus; colorCode: DeliveryColorCode } => {
  if (status === 'delivered') {
    return { status: 'delivered', colorCode: 'white' };
  }

  const daysPastDue = getDaysPastDue(deliveryDate);

  if (daysPastDue >= 2) {
    return {
      status: 'overdue',
      colorCode: daysPastDue >= 3 ? 'red' : 'orange',
    };
  }

  return { status: 'pending', colorCode: 'white' };
};

export const getColorCodeLabel = (colorCode: DeliveryColorCode): string => {
  const labels: Record<DeliveryColorCode, string> = {
    white: 'On schedule',
    orange: 'Overdue 2 days',
    red: 'Overdue 3+ days',
  };
  return labels[colorCode];
};
