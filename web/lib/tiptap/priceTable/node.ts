import { Node } from '@tiptap/core';

export type PriceRow = { name: string; qty: number; price: number; discount: number };

export const PriceTableNode = Node.create({
  name: 'priceTable',
  group: 'block',
  atom: true,
  addAttributes() {
    return { currency: { default: 'RUB' }, rows: { default: [] as PriceRow[] } };
  },
  parseHTML() { return [{ tag: 'div[data-price-table]' }]; },
  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as { rows?: PriceRow[]; currency: string };
    const rows: PriceRow[] = attrs.rows || [];
    const toNum = (x: unknown) => Number((x as number | string | undefined) ?? 0);
    const formatMoney = (value: number) => {
      try {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: attrs.currency || 'RUB' }).format(value || 0);
      } catch {
        return (value || 0).toFixed(2);
      }
    };
    const totals = rows.reduce((a: number, r: PriceRow) => a + toNum(r.qty) * toNum(r.price) * (1 - toNum(r.discount) / 100), 0);
    return ['div', { 'data-price-table': '', 'data-currency': attrs.currency },
      ['table', {},
        ['thead', {}, ['tr', {}, ['th', {}, 'Позиция'], ['th', {}, 'Кол-во'], ['th', {}, 'Цена'], ['th', {}, 'Скидка'], ['th', {}, 'Сумма']]],
        ['tbody', {}, ...rows.map((r: PriceRow) => ['tr', {},
          ['td', {}, r.name || ''],
          ['td', {}, String(r.qty || 0)],
          ['td', {}, String(r.price || 0)],
          ['td', {}, `${r.discount ?? 0}%`],
          ['td', {}, formatMoney(toNum(r.qty) * toNum(r.price) * (1 - toNum(r.discount) / 100))],
        ])],
        ['tfoot', {}, ['tr', {}, ['td', { colSpan: 4 }, 'Итого'], ['td', {}, formatMoney(totals)]]]
      ]
    ];
  },
});

