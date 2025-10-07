import { describe, it, expect } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import { reorderBlock } from '../reorder';
import { Spacer } from '../../spacer';
import { PriceTableNode } from '../../priceTable/node';

const createEditor = (content: unknown) => new Editor({
  extensions: [StarterKit, Spacer, PriceTableNode],
  content,
});

const getPositions = (doc: ProseMirrorNode) => {
  const positions: number[] = [];
  doc.forEach((_node: ProseMirrorNode, offset: number) => positions.push(offset));
  return positions;
};

const getNodeRange = (doc: ProseMirrorNode, index: number) => {
  const pos = getPositions(doc)[index];
  const node = doc.nodeAt(pos);
  if (!node) throw new Error('Node not found');
  return { from: pos, to: pos + node.nodeSize, type: node.type.name };
};

describe('reorderBlock', () => {
  it('moves spacer block down', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A' }] },
        { type: 'spacer', attrs: { size: 24 } },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'B' }] },
      ],
    });

    const { state } = editor;
    const range = getNodeRange(state.doc, 1);

    const tr = reorderBlock({ tr: state.tr, from: range.from, to: range.to, direction: 'down' });
    expect(tr).not.toBeNull();
    if (!tr) return;

    const names: string[] = [];
    tr.doc.forEach((node: ProseMirrorNode) => names.push(node.type.name));
    expect(names).toEqual(['heading', 'heading', 'spacer']);
  });

  it('moves block up', () => {
    const editor = createEditor({
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'A' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'B' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'C' }] },
      ],
    });

    const { state } = editor;
    const range = getNodeRange(state.doc, 2);

    const tr = reorderBlock({ tr: state.tr, from: range.from, to: range.to, direction: 'up' });
    expect(tr).not.toBeNull();
    if (!tr) return;

    const names: string[] = [];
    tr.doc.forEach((node: ProseMirrorNode) => names.push(node.textContent));
    expect(names).toEqual(['A', 'C', 'B']);
  });
});
