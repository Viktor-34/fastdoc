import type { TwoColumnsProps } from './types';

/**
 * Чистый UI компонент для двухколоночного макета
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function TwoColumns({
  layout = '50-50',
  gap = 24,
  leftContent,
  rightContent,
  className = '',
}: TwoColumnsProps) {
  // Определяем соотношение колонок
  const getGridTemplate = () => {
    switch (layout) {
      case '60-40':
        return '60% 40%';
      case '40-60':
        return '40% 60%';
      default:
        return '1fr 1fr';
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gap: `${gap}px`,
    gridTemplateColumns: getGridTemplate(),
    padding: '24px',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
  };

  const columnStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  };

  // Адаптивность для мобильных устройств
  const mediaQuery = '@media (max-width: 768px)';

  return (
    <div 
      className={`two-columns ${className}`} 
      data-type="two-columns" 
      style={containerStyle}
    >
      <style>{`
        ${mediaQuery} {
          .two-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <div className="two-columns__column" data-column="left" style={columnStyle}>
        {leftContent}
      </div>
      
      <div className="two-columns__column" data-column="right" style={columnStyle}>
        {rightContent}
      </div>
    </div>
  );
}


