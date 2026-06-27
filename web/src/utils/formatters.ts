const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

export const formatCurrency = (amount: number): string => currencyFormatter.format(amount);

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    delivered: 'success',
    pending: 'warning',
    overdue: 'error',
    paid: 'success',
    cancelled: 'default',
    enabled: 'success',
    disabled: 'default',
    active: 'success',
    inactive: 'default',
  };
  return colors[status] || 'default';
};

export const getColorCodeDot = (color: string): string => {
  const colors: Record<string, string> = {
    white: '#d9d9d9',
    orange: '#fa8c16',
    red: '#ff4d4f',
  };
  return colors[color] || '#d9d9d9';
};

export const getColorCodeClass = (color: string): string => {
  const classes: Record<string, string> = {
    white: 'status-dot status-dot--white',
    orange: 'status-dot status-dot--orange',
    red: 'status-dot status-dot--red',
  };
  return classes[color] || 'status-dot status-dot--white';
};
