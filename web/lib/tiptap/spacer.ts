import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      insertSpacer: (size?: number) => ReturnType;
      setSpacerSize: (size: number) => ReturnType;
    }
  }
}

export const Spacer = Node.create({
  name: 'spacer',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() { return { size: { default: 24 } }; },
  parseHTML() { return [{ tag: 'div[data-spacer]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-spacer': '', style: `height:${HTMLAttributes.size}px` })];
  },
  addCommands() {
    return {
      insertSpacer: (size = 24) => ({ chain }) =>
        chain().insertContent({ type: this.name, attrs: { size } }).run(),
      setSpacerSize: (size: number) => ({ commands }) =>
        commands.updateAttributes(this.name, { size }),
    };
  },
});


