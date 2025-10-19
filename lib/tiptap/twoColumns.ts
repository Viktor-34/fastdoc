import { Node, mergeAttributes } from '@tiptap/core';
import { paddingAttributeConfig, applyPaddingToNodeHTMLAttributes } from './paddingNodes';

// Добавляем команду twoColumns в Tiptap.
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twoColumns: {
      insertTwoColumns: () => ReturnType;
    };
  }
}

// Один столбец из двух: хранит индекс и padding.
export const TwoColumn = Node.create({
  name: 'twoColumn',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,
  selectable: false,
  addAttributes() {
    return {
      ...paddingAttributeConfig(0, 0),
      index: {
        default: 0,
        renderHTML: (attributes) => ({ 'data-index': attributes.index }),
        parseHTML: (element) => Number(element.getAttribute('data-index') ?? 0),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-two-column]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = applyPaddingToNodeHTMLAttributes(HTMLAttributes as Record<string, unknown>, { top: 0, bottom: 0 });
    const { index, ...rest } = attrs as Record<string, unknown>;
    return [
      'div',
      mergeAttributes(rest, {
        'data-two-column': '',
        'data-index': index,
        class: 'two-columns__column',
        style,
      }),
      0,
    ];
  },
});

// Контейнер двух колонок, содержит ровно два TwoColumn.
export const TwoColumns = Node.create({
  name: 'twoColumns',
  group: 'block',
  content: 'twoColumn{2}',
  defining: true,
  isolating: true,
  draggable: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-two-columns]' }];
  },
  renderHTML({ HTMLAttributes }) {
    const { attrs, style } = applyPaddingToNodeHTMLAttributes(HTMLAttributes as Record<string, unknown>, { top: 20, bottom: 20 });
    return ['div', mergeAttributes(attrs, { 'data-two-columns': '', class: 'two-columns', style }), 0];
  },
  addCommands() {
    return {
      insertTwoColumns: () => ({ chain }) =>
        chain()
          .insertContent({
            type: this.name,
            content: [
              {
                type: 'twoColumn',
                attrs: { index: 0 },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Введите текст…' }] }],
              },
              {
                type: 'twoColumn',
                attrs: { index: 1 },
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Введите текст…' }] }],
              },
            ],
          })
          .run(),
    };
  },
});

// Экспортируем массив расширений для подключения в редактор.
export const createTwoColumnExtensions = () => [TwoColumns, TwoColumn];
