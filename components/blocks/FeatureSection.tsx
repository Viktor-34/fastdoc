import type { FeatureSectionProps, FeatureItemData } from './types';

/**
 * Компонент для отдельного элемента преимущества
 */
export function FeatureItem({
  iconSrc,
  iconAlt = 'Преимущество',
  title,
  description,
  iconSize = 72,
}: FeatureItemData & { iconSize?: number }) {
  const iconStyle: React.CSSProperties = {
    width: iconSize,
    height: iconSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    overflow: 'hidden',
    backgroundColor: iconSrc ? 'transparent' : '#f4f4f5',
    color: '#1F2937',
  };

  const iconImageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const iconPlaceholderStyle: React.CSSProperties = {
    fontSize: '32px',
    lineHeight: 1,
  };

  return (
    <div className="feature-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: '12px' }}>
      <div className="feature-item__icon" style={iconStyle}>
        {iconSrc ? (
          <img src={iconSrc} alt={iconAlt} style={iconImageStyle} />
        ) : (
          <span style={iconPlaceholderStyle} aria-hidden="true">★</span>
        )}
      </div>
      <div className="feature-item__content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
          {title}
        </h4>
        <p style={{ margin: 0, color: '#1f2937', fontSize: '14px', lineHeight: 1.45 }}>
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * Чистый UI компонент для секции с преимуществами
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function FeatureSection({
  backgroundColor = '#ffffff',
  backgroundImage = null,
  height = 360,
  iconSize = 72,
  title = 'Наши преимущества',
  items = [],
  paddingTop = 32,
  paddingBottom = 0,
  className = '',
}: FeatureSectionProps) {
  const sectionStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingTop: `${paddingTop}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: '8px',
    backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const innerStyle: React.CSSProperties = {
    display: 'grid',
    gap: '24px',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  };

  const titleStyle: React.CSSProperties = {
    gridColumn: '1 / -1',
    margin: 0,
    color: '#111827',
    fontWeight: 600,
    fontSize: '1.75rem',
    lineHeight: 1.25,
  };

  return (
    <section 
      className={`features-section ${className}`} 
      data-type="features" 
      style={sectionStyle}
    >
      <div style={innerStyle}>
        {title && <h2 style={titleStyle}>{title}</h2>}
        {items.map((item, index) => (
          <FeatureItem key={item.id || index} {...item} iconSize={iconSize} />
        ))}
      </div>
    </section>
  );
}


