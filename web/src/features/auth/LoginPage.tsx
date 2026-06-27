import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, Input, Button, Alert, Checkbox, App } from 'antd';
import { UserOutlined, LockOutlined} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoginAvatarIcon } from '@/components/icons/LoginAvatarIcon';
import { AuthBrandPanel } from '@/features/auth/AuthBrandPanel';
import { getLoginErrorMessage, REMEMBER_EMAIL_KEY } from '@/utils/authErrors';
import { LOGIN_COPY } from '@/features/auth/loginCopy';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or username').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
  remember: z.boolean(),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { modal } = App.useApp();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', remember: true },
    mode: 'onBlur',
  });

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setValue('identifier', savedEmail);
      setValue('remember', true);
    }
  }, [setValue]);

  const showAdminContact = () => {
    modal.info({
      title: LOGIN_COPY.contactAdmin,
      content:
        'New accounts are created by your system administrator only. Please contact them to request access.',
      okText: 'Got it',
      centered: true,
    });
  };

  const showForgotPassword = () => {
    modal.info({
      title: LOGIN_COPY.forgotPassword,
      content:
        'Password resets are handled by your system administrator. Contact them with your registered email to restore access.',
      okText: 'Understood',
      centered: true,
    });
  };

  const onSubmit = async (data: LoginForm) => {
    setLoginError(null);
    try {
      const loggedInUser = await login(data.identifier.trim().toLowerCase(), data.password);
      if (data.remember) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, data.identifier.trim().toLowerCase());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
      navigate(loggedInUser.isOnboarded === false ? '/onboarding' : '/dashboard', { replace: true });
    } catch (error) {
      setLoginError(getLoginErrorMessage(error));
      resetField('password');
    }
  };

  return (
    <div className="login-page">
      <AuthBrandPanel headline={LOGIN_COPY.headline} description={LOGIN_COPY.description} />

      <section className="login-page__panel">
        <div className="login-page__watermark" aria-hidden />
        <div className="login-page__panel-content">
          <div className="login-page__card">
            <div className="login-page__card-header">
              <LoginAvatarIcon />
              <h2 className="login-page__card-title">{LOGIN_COPY.welcomeTitle}</h2>
              <p className="login-page__card-subtitle">{LOGIN_COPY.welcomeSubtitle}</p>
            </div>

            {loginError && (
              <Alert
                type="error"
                message={loginError}
                showIcon
                closable
                className="login-page__alert"
                onClose={() => setLoginError(null)}
              />
            )}

            <Form layout="vertical" onFinish={handleSubmit(onSubmit)} className="login-page__form">
              <Form.Item
                label={LOGIN_COPY.usernameLabel}
                validateStatus={errors.identifier ? 'error' : ''}
                help={errors.identifier?.message}
              >
                <Controller
                  name="identifier"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined className="login-page__input-icon" />}
                      placeholder={LOGIN_COPY.usernamePlaceholder}
                      size="large"
                      autoFocus
                      allowClear
                      autoComplete="username email"
                      spellCheck={false}
                      className="login-page__input"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={LOGIN_COPY.passwordLabel}
                validateStatus={errors.password ? 'error' : ''}
                help={errors.password?.message}
              >
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined className="login-page__input-icon" />}
                      placeholder={LOGIN_COPY.passwordPlaceholder}
                      size="large"
                      allowClear
                      autoComplete="current-password"
                      className="login-page__input"
                    />
                  )}
                />
              </Form.Item>

              <div className="login-page__options">
                <Controller
                  name="remember"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Checkbox checked={value} onChange={(e) => onChange(e.target.checked)}>
                      {LOGIN_COPY.rememberMe}
                    </Checkbox>
                  )}
                />
                <button type="button" className="login-page__link" onClick={showForgotPassword}>
                  {LOGIN_COPY.forgotPassword}
                </button>
              </div>

              <Form.Item className="login-page__submit">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  block
                  size="large"
                  icon={<LockOutlined />}
                  iconPlacement="start"
                  className="login-page__submit-btn"
                >
                  {LOGIN_COPY.signIn}
                </Button>
                
              </Form.Item>
            </Form>
            <p className="login-page__card-footer">
              {LOGIN_COPY.noAccount}{' '}
              <button type="button" className="login-page__link" onClick={showAdminContact}>
                {LOGIN_COPY.contactAdmin}
              </button>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
