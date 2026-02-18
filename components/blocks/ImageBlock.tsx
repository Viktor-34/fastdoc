import type { ImageBlockProps } from './types';

/**
 * Чистый UI компонент для изображения
 * Может использоваться в редакторе, публичном просмотре и PDF
 */
export function ImageBlock({
  src,
  alt = '',
  caption,
  width,
  height,
  className = '',
}: ImageBlockProps) {
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    padding: 0,
    border: 'none',
    background: 'transparent',
    margin: 0,
    width: '100%',
    overflow: 'hidden',
  };

  const imageStyle: React.CSSProperties = {
    display: 'block',
    borderRadius: '16px',
    objectFit: 'cover',
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
  };

  const captionStyle: React.CSSProperties = {
    marginTop: '8px',
    fontSize: '14px',
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  };

  if (!src) {
    return null;
  }

  return (
    <figure 
      className={`image-block ${className}`} 
      data-type="image" 
      style={containerStyle}
    >
      <img src={src} alt={alt} style={imageStyle} />
      {caption && (
        <figcaption style={captionStyle}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}



