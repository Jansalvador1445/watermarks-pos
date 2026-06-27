import { WaterDropIcon } from '@/components/icons/WaterDropIcon';

export const LoginAvatarIcon = () => (
  <div className="login-avatar-icon">
    <span className="login-avatar-icon__bubble login-avatar-icon__bubble--1" />
    <span className="login-avatar-icon__bubble login-avatar-icon__bubble--2" />
    <span className="login-avatar-icon__bubble login-avatar-icon__bubble--3" />
    <div className="login-avatar-icon__circle">
      <WaterDropIcon className="login-avatar-icon__drop" />
    </div>
  </div>
);
