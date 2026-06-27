interface MobileListCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  fields?: Array<{ label: React.ReactNode; value: React.ReactNode }>;
  actions?: React.ReactNode;
}

export const MobileListCard = ({ title, subtitle, fields, actions }: MobileListCardProps) => (
  <article className="mobile-list-card">
    <div className="mobile-list-card__header">
      <div className="mobile-list-card__heading">
        <div className="mobile-list-card__title">{title}</div>
        {subtitle && <div className="mobile-list-card__subtitle">{subtitle}</div>}
      </div>
      {actions && <div className="mobile-list-card__actions">{actions}</div>}
    </div>
    {fields && fields.length > 0 && (
      <dl className="mobile-list-card__fields">
        {fields.map((field, index) => (
          <div key={index} className="mobile-list-card__field">
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    )}
  </article>
);
