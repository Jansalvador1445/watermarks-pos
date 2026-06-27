import { Card, Skeleton } from 'antd';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconVariant?: 'blue' | 'green' | 'orange' | 'gold' | 'purple' | 'red';
  subtext?: string;
  subtextTone?: 'success' | 'danger' | 'neutral';
  loading?: boolean;
  valueClassName?: string;
  index?: number;
}

export const StatCard = ({
  title,
  value,
  icon,
  iconVariant = 'blue',
  subtext,
  subtextTone = 'neutral',
  loading,
  valueClassName = 'stat-card__value',
  index = 0,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05, duration: 0.3 }}
  >
    <Card bordered={false} className="stat-card">
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div className="stat-card__inner">
          <div className="stat-card__content">
            <div className="stat-card__title">{title}</div>
            <div className={valueClassName}>{value}</div>
            {subtext && (
              <div className={`stat-card__subtext stat-card__subtext--${subtextTone}`}>{subtext}</div>
            )}
          </div>
          <div className={`stat-card__icon-box stat-card__icon-box--${iconVariant}`}>{icon}</div>
        </div>
      )}
    </Card>
  </motion.div>
);
