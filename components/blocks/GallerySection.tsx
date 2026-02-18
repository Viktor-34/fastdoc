import type { GallerySectionProps } from './types';

/**
 * Чистый UI компонент для галереи изображений
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function GallerySection({
  backgroundColor = '#ffffff',
  backgroundImage,
  columns = 2,
  gap = 16,
  items = [],
  paddingTop = 32,
  paddingBottom = 32,
  className = '',
}: GallerySectionProps) {
  const containerStyle: React.CSSProperties = {
    backgroundColor,
    backgroundImage: backgroundImage ? `url("${backgroundImage}")` : undefined,
    backgroundRepeat: backgroundImage ? 'no-repeat' : undefined,
    backgroundSize: backgroundImage ? 'cover' : undefined,
    backgroundPosition: backgroundImage ? 'center' : undefined,
    paddingTop: `${paddingTop}px`,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: '8px',
    position: 'relative',
  };

  const innerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: `${gap}px`,
    width: '100%',
  };

  const itemStyle: React.CSSProperties = {
    position: 'relative',
    aspectRatio: '1',
    overflow: 'hidden',
    borderRadius: '8px',
    backgroundColor: '#FAFAFA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const placeholderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFAFA',
    position: 'relative',
    minHeight: '200px',
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

  return (
    <section
      className={`gallery-section ${className}`}
      data-type="gallery-section"
      data-columns={columns}
      data-gap={gap}
      style={containerStyle}
    >
      <div className="gallery-section__inner" style={innerStyle}>
        {items.map((item, index) => (
          <div
            key={item.id || `gallery-item-${index}`}
            className="gallery-item"
            data-gallery-item=""
            data-gallery-item-id={item.id}
            data-has-image={item.imageSrc ? 'true' : 'false'}
            style={itemStyle}
          >
            {item.imageSrc ? (
              <img
                src={item.imageSrc}
                alt={item.imageAlt || 'Изображение'}
                className="gallery-item__image"
                style={imageStyle}
              />
            ) : (
              <div className="gallery-item__placeholder" style={placeholderStyle}>
                <div style={placeholderBeforeStyle} />
                <div style={placeholderAfterStyle} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
