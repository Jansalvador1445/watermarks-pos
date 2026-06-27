import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={<Button type="primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>}
    />
  );
};

export const ServerErrorPage = () => (
  <Result
    status="500"
    title="500"
    subTitle="Sorry, something went wrong on our end."
    extra={<Button type="primary" onClick={() => window.location.reload()}>Try Again</Button>}
  />
);
