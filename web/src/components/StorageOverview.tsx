import { Card, Button, Typography } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import slimGallonImg from '@/assets/gallons/slim-gallon.png';
import roundGallonImg from '@/assets/gallons/round-gallon.png';

interface GallonStock {
  inStock: number;
  lowStock: number;
  lowStockWarning?: boolean;
  containersOut?: number;
  netContainersOut?: number;
}

interface StorageOverviewProps {
  slim?: GallonStock;
  round?: GallonStock;
  movementsToday?: number;
  loading?: boolean;
}

const GallonItem = ({
  title,
  image,
  inStock,
  lowStock,
  lowStockWarning,
  netContainersOut,
}: {
  title: string;
  image: string;
  inStock: number;
  lowStock: number;
  lowStockWarning?: boolean;
  netContainersOut?: number;
}) => (
  <div className="storage-overview__item">
    <div className="storage-overview__image-wrap">
      <img src={image} alt={`${title} water gallon`} className="storage-overview__image" />
    </div>
    <h4 className="storage-overview__type">{title}</h4>
    <div className="storage-overview__stats">
      <div className="storage-overview__stat">
        <span className="storage-overview__label">Filled Stock</span>
        <span className={`storage-overview__value ${lowStockWarning ? 'storage-overview__value--warning' : ''}`}>
          {inStock}
        </span>
      </div>
      <div className="storage-overview__stat">
        <span className="storage-overview__label">Threshold</span>
        <span className="storage-overview__value">{lowStock}</span>
      </div>
      {netContainersOut !== undefined && (
        <div className="storage-overview__stat">
          <span className="storage-overview__label">Containers Out</span>
          <span className="storage-overview__value">{netContainersOut}</span>
        </div>
      )}
    </div>
  </div>
);

export const StorageOverview = ({ slim, round, movementsToday, loading }: StorageOverviewProps) => {
  const navigate = useNavigate();

  return (
    <Card
      title="Storage Overview (Inventory)"
      bordered={false}
      className="card-rounded storage-overview dashboard-chart-card"
      loading={loading}
      extra={
        movementsToday !== undefined ? (
          <Typography.Text type="secondary">{movementsToday} movement(s) today</Typography.Text>
        ) : undefined
      }
    >
      <div className="storage-overview__grid">
        <GallonItem
          title="Slim (Faucet)"
          image={slimGallonImg}
          inStock={slim?.inStock ?? 0}
          lowStock={slim?.lowStock ?? 0}
          lowStockWarning={slim?.lowStockWarning}
          netContainersOut={slim?.netContainersOut}
        />
        <div className="storage-overview__divider" />
        <GallonItem
          title="Round"
          image={roundGallonImg}
          inStock={round?.inStock ?? 0}
          lowStock={round?.lowStock ?? 0}
          lowStockWarning={round?.lowStockWarning}
          netContainersOut={round?.netContainersOut}
        />
      </div>
      <Button type="link" className="storage-overview__link" onClick={() => navigate('/inventory')}>
        Go to Inventory <ArrowRightOutlined />
      </Button>
    </Card>
  );
};
