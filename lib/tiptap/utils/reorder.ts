import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { Transaction } from 'prosemirror-state';

export type ReorderDirection = 'up' | 'down';

export interface ReorderParams {
  tr: Transaction;
  from: number;
  to: number;
  direction: ReorderDirection;
}

const getPosBeforeIndex = (doc: ProseMirrorNode, index: number): number => {
  if (index <= 0) return 0;
  let pos = 0;
  const max = Math.min(index, doc.childCount);
  for (let i = 0; i < max; i += 1) {
    pos += doc.child(i).nodeSize;
  }
  return pos;
};

const getPosAfterIndex = (doc: ProseMirrorNode, index: number): number => {
  if (index < 0) return 0;
  const bounded = Math.min(index, doc.childCount - 1);
  return getPosBeforeIndex(doc, bounded + 1);
};

export function reorderBlock({ tr, from, to, direction }: ReorderParams): Transaction | null {
  const doc = tr.doc;
  const positions: number[] = [];
  doc.forEach((_node, offset) => positions.push(offset));
  const index = positions.indexOf(from);
  if (index === -1) return null;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= positions.length) return null;

  const slice = doc.slice(from, to);
  tr = tr.delete(from, to);
  const updatedDoc = tr.doc;

  if (direction === 'up') {
    const insertPos = getPosBeforeIndex(updatedDoc, targetIndex);
    return tr.insert(insertPos, slice.content);
  }

  const insertAfterIndex = targetIndex - 1;
  const insertPos = insertAfterIndex >= 0
    ? getPosAfterIndex(updatedDoc, insertAfterIndex)
    : updatedDoc.content.size;
  return tr.insert(insertPos, slice.content);
}
