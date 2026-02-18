import type { LogoSectionProps } from './types';

/**
 * Чистый UI компонент для секции с логотипом
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function LogoSection({
  backgroundColor = '#ffffff',
  backgroundImage = null,
  height = 240,
  logoSrc = null,
  logoAlt = 'Логотип',
  logoSize = 160,
  paddingTop = 0,
  paddingBottom = 0,
  className = '',
}: LogoSectionProps) {
  const sectionStyle: React.CSSProperties = {
    minHeight: height,
    backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '8px',
    padding: '24px',
    paddingTop: `${paddingTop}px`,
    paddingBottom: `${paddingBottom}px`,
  };

  const logoStyle: React.CSSProperties = {
    width: logoSize,
    maxWidth: '100%',
    height: 'auto',
    objectFit: 'contain',
    position: 'relative',
    zIndex: 1,
  };

  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 24px',
    borderRadius: '9999px',
    border: '1px dashed rgba(148, 163, 184, 0.7)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    position: 'relative',
    zIndex: 1,
  };

  return (
    <section 
      className={`logo-section ${className}`} 
      data-type="logo" 
      style={sectionStyle}
    >
      {logoSrc ? (
        <img src={logoSrc} alt={logoAlt} style={logoStyle} />
      ) : (
        <div style={placeholderStyle}>
          Загрузите логотип
        </div>
      )}
    </section>
  );
}



