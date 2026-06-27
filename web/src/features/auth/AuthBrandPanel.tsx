import { BrandLogo } from '@/components/icons/BrandLogo';
import brandSplash from '@/assets/login-brand-splash.png';
import { LOGIN_COPY } from '@/features/auth/loginCopy';

interface AuthBrandPanelProps {
  headline: string;
  description: string;
  showCopyright?: boolean;
}

export const AuthBrandPanel = ({
  headline,
  description,
  showCopyright = true,
}: AuthBrandPanelProps) => (
  <section className="login-page__brand">
    <div className="login-page__brand-watermark" aria-hidden />
    <img
      src={brandSplash}
      alt=""
      className="login-page__brand-splash"
      aria-hidden
      fetchPriority="high"
      decoding="async"
    />
    <div className="login-page__brand-blend" aria-hidden />
    <div className="login-page__brand-gradient" aria-hidden />
    <div className="login-page__brand-content">
      <div className="login-page__brand-copy">
        <BrandLogo />
        <h1 className="login-page__headline">{headline}</h1>
        <div className="login-page__headline-accent" />
        <p className="login-page__description">{description}</p>
      </div>
      {showCopyright && <p className="login-page__copyright">{LOGIN_COPY.copyright}</p>}
    </div>
  </section>
);
