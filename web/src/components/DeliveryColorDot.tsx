import { resolveDeliveryColorCode, getColorCodeLabel } from '@/utils/deliveryColor';
import { getColorCodeClass } from '@/utils/formatters';

interface DeliveryColorDotProps {
  status: string;
  date: string | Date;
  colorCode?: string;
  showLabel?: boolean;
}

export const DeliveryColorDot = ({ status, date, colorCode, showLabel = false }: DeliveryColorDotProps) => {
  const resolved = resolveDeliveryColorCode(status, date, colorCode);
  const label = getColorCodeLabel(resolved);

  return (
    <span className="delivery-color-cell" title={label}>
      <span className={getColorCodeClass(resolved)} aria-hidden />
      {showLabel && <span className="delivery-color-cell__label">{label}</span>}
    </span>
  );
};
