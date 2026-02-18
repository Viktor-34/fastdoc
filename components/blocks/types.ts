/**
 * Общие типы для блоков документа
 * Эти типы используются в чистых UI компонентах
 */

export interface LogoSectionProps {
  backgroundColor?: string;
  backgroundImage?: string | null;
  height?: number;
  logoSrc?: string | null;
  logoAlt?: string;
  logoSize?: number;
  paddingTop?: number;
  paddingBottom?: number;
  className?: string;
}

export interface FeatureSectionProps {
  backgroundColor?: string;
  backgroundImage?: string | null;
  height?: number;
  iconSize?: number;
  title?: string;
  items?: FeatureItemData[];
  paddingTop?: number;
  paddingBottom?: number;
  className?: string;
}

export interface FeatureItemData {
  id?: string;
  iconSrc?: string | null;
  iconAlt?: string;
  title: string;
  description: string;
}

export interface TwoColumnsProps {
  layout?: '50-50' | '60-40' | '40-60';
  gap?: number;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
}

export interface SpacerProps {
  size?: number;
  variant?: 'empty' | 'divider-solid' | 'divider-dashed';
  className?: string;
}

export interface ImageBlockProps {
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
}

export interface TextImageSectionProps {
  backgroundColor?: string;
  backgroundImage?: string | null;
  height?: number;
  imageSrc?: string | null;
  imageAlt?: string;
  title?: string;
  content?: React.ReactNode;
  contentAlign?: 'start' | 'center' | 'end';
  paddingTop?: number;
  paddingBottom?: number;
  className?: string;
}

export interface GalleryItemData {
  id?: string;
  imageSrc?: string | null;
  imageAlt?: string;
}

export interface GallerySectionProps {
  backgroundColor?: string;
  backgroundImage?: string | null;
  columns?: number;
  gap?: number;
  items?: GalleryItemData[];
  paddingTop?: number;
  paddingBottom?: number;
  className?: string;
}

