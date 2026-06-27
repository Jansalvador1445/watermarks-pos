import { WaterDropIcon } from '@/components/icons/WaterDropIcon';
import { LOGIN_COPY } from '@/features/auth/loginCopy';

export const BrandLogo = () => (
  <div className="brand-logo">
    <WaterDropIcon className="brand-logo__icon" />
    <div className="brand-logo__text">
      <span className="brand-logo__h2o">{LOGIN_COPY.brandH2o}</span>
      <span className="brand-logo__sub">{LOGIN_COPY.brandSub}</span>
    </div>
  </div>
);
