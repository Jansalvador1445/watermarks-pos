import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, Input, Button, Alert, App } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { LoginAvatarIcon } from '@/components/icons/LoginAvatarIcon';
import { AuthBrandPanel } from '@/features/auth/AuthBrandPanel';

const onboardingSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username is too long')
      .regex(/^[a-z0-9._-]+$/, 'Use lowercase letters, numbers, dots, dashes, or underscores only'),
    email: z.string().email('Enter a valid email address').max(255),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type OnboardingForm = z.infer<typeof onboardingSchema>;

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const { user } = useAuthStore();
  const { message } = App.useApp();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: '',
      email: user?.email || '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: OnboardingForm) => {
    setError(null);
    try {
      await completeOnboarding({
        username: data.username.toLowerCase().trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });
      message.success('Your account is ready!');
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not complete setup. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <AuthBrandPanel
        headline="Set Up Your Account"
        description="Choose your own username, email, and password to keep your account private and secure."
      />

      <section className="login-page__panel">
        <div className="login-page__watermark" aria-hidden />
        <div className="login-page__panel-content">
          <div className="login-page__card">
            <div className="login-page__card-header">
              <LoginAvatarIcon />
              <h2 className="login-page__card-title">Welcome, {user?.name?.split(' ')[0] || 'there'}!</h2>
              <p className="login-page__card-subtitle">Complete your profile before continuing</p>
            </div>

            {error && (
              <Alert type="error" message={error} showIcon closable className="login-page__alert" onClose={() => setError(null)} />
            )}

            <Form layout="vertical" onFinish={handleSubmit(onSubmit)} className="login-page__form">
              <Form.Item
                label="Username"
                validateStatus={errors.username ? 'error' : ''}
                help={errors.username?.message || 'You can use this to sign in instead of email'}
              >
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<UserOutlined className="login-page__input-icon" />}
                      placeholder="e.g. juan.delacruz"
                      size="large"
                      autoComplete="username"
                      className="login-page__input"
                      onChange={(e) => field.onChange(e.target.value.toLowerCase())}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Email"
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      prefix={<MailOutlined className="login-page__input-icon" />}
                      placeholder="your.email@example.com"
                      size="large"
                      autoComplete="email"
                      className="login-page__input"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="New Password"
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
                      placeholder="At least 8 characters"
                      size="large"
                      autoComplete="new-password"
                      className="login-page__input"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                validateStatus={errors.confirmPassword ? 'error' : ''}
                help={errors.confirmPassword?.message}
              >
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined className="login-page__input-icon" />}
                      placeholder="Re-enter your password"
                      size="large"
                      autoComplete="new-password"
                      className="login-page__input"
                    />
                  )}
                />
              </Form.Item>

              <Form.Item className="login-page__submit">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  block
                  size="large"
                  className="login-page__submit-btn"
                >
                  Save & Continue
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </section>
    </div>
  );
};
