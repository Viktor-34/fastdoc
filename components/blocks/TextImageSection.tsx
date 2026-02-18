import type { TextImageSectionProps } from './types';

/**
 * Чистый UI компонент для блока с текстом и изображением
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function TextImageSection({
  backgroundColor = '#ffffff',
  backgroundImage,
  height = 400,
  imageSrc,
  imageAlt = 'Изображение',
  title = 'Заголовок',
  content,
  contentAlign = 'center',
  paddingTop = 32,
  paddingBottom = 32,
  className = '',
}: TextImageSectionProps) {
  const containerStyle: React.CSSProperties = {
    backgroundColor,
    backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
    backgroundRepeat: backgroundImage ? 'no-repeat' : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined,
    minHeight: `${height}px`,
    paddingTop: `${paddingTop}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: '16px',
    position: 'relative',
  };

  const innerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px',
    height: '100%',
    alignItems: 'center',
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: contentAlign === 'start' ? 'flex-start' : contentAlign === 'end' ? 'flex-end' : 'center',
    height: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
  };

  const textStyle: React.CSSProperties = {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#475569',
    margin: 0,
  };

  const imageContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '300px',
    overflow: 'hidden',
    borderRadius: '12px',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '12px',
  };

  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    minHeight: '300px',
    backgroundColor: '#FAFAFA',
    position: 'relative',
    borderRadius: '12px',
  };

  const placeholderBeforeStyle: React.CSSProperties = {
    position: 'absolute',
    width: '113.75px',
    height: '113.44px',
    background: 'radial-gradient(circle, rgba(192,191,191,0.4) 0%, rgba(192,191,191,0) 70%)',
    zIndex: 1,
  };

  const placeholderAfterStyle: React.CSSProperties = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23FFFFFF' stroke='%23E5E5E5' stroke-width='1'/%3E%3Cpath d='M16 17.5C16 17.5 16.5 17 17.5 17C18.5 17 19 17.5 19 17.5L23 21.5M16 17.5V26.5M16 17.5L12 21.5M23 21.5V26.5M23 21.5L27 17.5M23 26.5H16M23 26.5L27 22.5M16 26.5L12 22.5' stroke='%2357534D' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    zIndex: 2,
  };

  // Адаптивность для мобильных устройств
  const mediaQuery = '@media (max-width: 768px)';

  return (
    <section 
      className={`text-image-section ${className}`} 
      data-type="text-image-section" 
      style={containerStyle}
    >
      <style>{`
        ${mediaQuery} {
          .text-image-section__inner {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      <div className="text-image-section__inner" style={innerStyle}>
        <div className="text-image-section__content" style={contentStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {content && typeof content === 'string' ? (
            <p style={textStyle}>{content}</p>
          ) : (
            content
          )}
        </div>
        
        <div className="text-image-section__image" style={imageContainerStyle}>
          {imageSrc ? (
            <img src={imageSrc} alt={imageAlt} style={imageStyle} />
          ) : (
            <div className="text-image-section__placeholder" style={placeholderStyle}>
              <div style={placeholderBeforeStyle} />
              <div style={placeholderAfterStyle} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
