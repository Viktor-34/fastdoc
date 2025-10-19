import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Spacer } from './spacer';
import { PriceTable } from './priceTable/view';
import { PriceTableNode } from './priceTable/node';
import { FontSize } from './fontSize';
import { ImageBlock } from './image';
import { createTwoColumnExtensions } from './twoColumns';
import {
  ParagraphWithPadding,
  HeadingWithPadding,
  BulletListWithPadding,
  OrderedListWithPadding,
  CodeBlockWithPadding,
} from './paddingNodes';
import type { AnyExtension } from '@tiptap/core';

// Набор клиентских расширений Tiptap: включает визуальные блоки.
export function createClientExtensions(): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: false,
      paragraph: false,
      bulletList: false,
      orderedList: false,
      codeBlock: false,
    }),
    ParagraphWithPadding,
    HeadingWithPadding,
    BulletListWithPadding,
    OrderedListWithPadding,
    CodeBlockWithPadding,
    ImageBlock,
    Link,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    FontSize,
    Spacer,
    ...createTwoColumnExtensions(),
    PriceTable,
  ];
}

// Серверный набор (без PriceTable view, но с node), нужен для рендера HTML.
export function createServerExtensions(): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: false,
      paragraph: false,
      bulletList: false,
      orderedList: false,
      codeBlock: false,
    }),
    ParagraphWithPadding,
    HeadingWithPadding,
    BulletListWithPadding,
    OrderedListWithPadding,
    CodeBlockWithPadding,
    ImageBlock,
    Link,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    FontSize,
    Spacer,
    ...createTwoColumnExtensions(),
    PriceTableNode,
  ];
}
