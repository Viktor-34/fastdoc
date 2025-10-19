import { Node, mergeAttributes } from '@tiptap/core';
import { paddingAttributeConfig, applyPaddingToNodeHTMLAttributes } from './paddingNodes';

// Добавляем команды spacer в API Tiptap.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      insertSpacer: (size?: number) => ReturnType;
      setSpacerSize: (size: number) => ReturnType;
      setSpacerVariant: (variant: 'empty' | 'divider-solid' | 'divider-dashed') => ReturnType;
    }
  }
}

// Узел Spacer: вставляет пустой блок или разделитель.
export const Spacer = Node.create({
  name: 'spacer',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      ...paddingAttributeConfig(0, 0),
      size: { default: 24 },
      variant: { default: 'empty' },
    };
  },
  parseHTML() { return [{ tag: 'div[data-spacer]' }]; },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = applyPaddingToNodeHTMLAttributes(HTMLAttributes as Record<string, unknown>, { top: 0, bottom: 0 });
    const size = Number(attrs.size ?? 24);
    const variant = (attrs.variant ?? 'empty') as 'empty' | 'divider-solid' | 'divider-dashed';
    const baseAttrs = mergeAttributes(attrs, {
      'data-spacer': '',
      'data-variant': variant,
      class: 'spacer-block',
    });

    if (variant === 'empty') {
      const styleParts = [`height:${size}px`, style];
      return ['div', { ...baseAttrs, style: styleParts.filter(Boolean).join(';') }];
    }

    const borderStyle = variant === 'divider-dashed' ? 'dashed' : 'solid';
    const margin = Math.max(size, 0);
    const styleParts = [
      `margin:${margin}px 0`,
      `border-top:1px ${borderStyle} #D0D5DD`,
      style,
    ];
    return ['div', {
      ...baseAttrs,
      style: styleParts.filter(Boolean).join(';'),
    }];
  },
  addCommands() {
    return {
      insertSpacer: (size = 24) => ({ chain }) =>
        chain().insertContent({ type: this.name, attrs: { size } }).run(),
      setSpacerSize: (size: number) => ({ commands }) =>
        commands.updateAttributes(this.name, { size }),
      setSpacerVariant: (variant: 'empty' | 'divider-solid' | 'divider-dashed') => ({ commands }) =>
        commands.updateAttributes(this.name, { variant }),
    };
  },
});
