import { Tag } from 'antd';

interface StockChipProps {
  currentStock: number;
  lowStockThreshold?: number;
  className?: string;
}

export const StockChip = ({ currentStock, lowStockThreshold = 0, className }: StockChipProps) => {
  const isLow = currentStock <= lowStockThreshold;

  return (
    <Tag color={isLow ? 'warning' : 'success'} className={className ?? 'text-xs'}>
      Stock: {currentStock}
      {isLow ? ' (LOW)' : ''}
    </Tag>
  );
};
