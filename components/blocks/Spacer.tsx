import type { SpacerProps } from './types';

/**
 * Чистый UI компонент для отступов и разделителей
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function Spacer({
  size = 24,
  variant = 'empty',
  className = '',
}: SpacerProps) {
  const baseStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    margin: '12px 0',
  };

  const emptyStyle: React.CSSProperties = {
    ...baseStyle,
    height: `${size}px`,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
  };

  const dividerStyle: React.CSSProperties = {
    ...baseStyle,
    borderTop: variant === 'divider-dashed' 
      ? '1px dashed #D0D5DD' 
      : '1px solid #D0D5DD',
    margin: '24px 0',
  };

  const style = variant === 'empty' ? emptyStyle : dividerStyle;

  return (
    <div 
      className={`spacer-block ${className}`} 
      data-type="spacer" 
      data-variant={variant}
      style={style}
      aria-hidden="true"
    />
  );
}



