import axios from 'axios';

export const getLoginErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) {
    return 'Unable to sign in. Please check your connection and try again.';
  }

  const status = error.response?.status;
  const message = error.response?.data?.message as string | undefined;

  if (status === 429) {
    return message || 'Too many login attempts. Please wait 15 minutes before trying again.';
  }

  if (status === 423) {
    return message || 'Account temporarily locked due to multiple failed attempts.';
  }

  if (status === 401) {
    return 'Invalid email or password. Please try again.';
  }

  if (status === 400 && message) {
    return message;
  }

  return message || 'Unable to sign in. Please try again.';
};

export const REMEMBER_EMAIL_KEY = 'h2o_remember_email';
