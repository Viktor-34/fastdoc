import Image from '@tiptap/extension-image';
import { applyPaddingToNodeHTMLAttributes, paddingAttributeConfig } from './paddingNodes';

// Расширение блока изображения: добавляет padding, aspect ratio и ссылку.
export const ImageBlock = Image.extend({
  draggable: true,
  inline: false,
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      ...paddingAttributeConfig(0, 0),
      class: {
        default: 'image-block',
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      opacity: {
        default: 1,
        parseHTML: (element) => {
          const value = element.style.opacity;
          return value ? Number.parseFloat(value) : 1;
        },
      },
      href: {
        default: null,
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style: paddingStyle } = applyPaddingToNodeHTMLAttributes(HTMLAttributes as Record<string, unknown>, { top: 0, bottom: 0 });
    const {
      class: className,
      width,
      height,
      style: inlineStyle,
      opacity,
      href,
      ...rest
    } = attrs as Record<string, unknown>;
    const aspectRatio = width && height ? `${width}/${height}` : undefined;
    const styles: string[] = [];
    if (paddingStyle) styles.push(paddingStyle);
    if (inlineStyle) styles.push(String(inlineStyle));
    if (aspectRatio) styles.push(`aspect-ratio:${aspectRatio}`);
    const containerStyle = styles.filter(Boolean).join(';') || undefined;
    const imgStyleParts = [
      aspectRatio ? 'width:100%;height:100%;object-fit:cover;' : 'width:100%;height:auto;object-fit:cover;',
    ];
    if (opacity != null) {
      imgStyleParts.push(`opacity:${opacity};`);
    }
    const imageAttrs = { ...rest, width, height, style: imgStyleParts.join('') };
    const img = ['img', imageAttrs];
    const content = href ? ['a', { href, target: '_blank', rel: 'noopener noreferrer' }, img] : img;
    return ['div', { class: className ?? 'image-block', style: containerStyle }, content];
  },
});
