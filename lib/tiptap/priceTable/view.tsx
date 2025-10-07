'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { withWorkspaceHeader } from '@/lib/workspace-client';
import { PriceTableNode } from './node';
import type { PriceRow } from './node';

type CatalogProduct = {
  id: string;
  name: string;
  currency: string;
  basePrice: number;
};

type CatalogResponse = {
  products?: Array<{
    id: string;
    name: string;
    currency: string;
    basePrice: number;
  }>;
};

const defaultRow: PriceRow = { name: 'Позиция', qty: 1, price: 0, discount: 0 };

export function PriceTableView({ node, updateAttributes, editor }: NodeViewProps) {
  const [rows, setRows] = useState<PriceRow[]>(node.attrs.rows || []);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const currency = node.attrs.currency || 'RUB';
  const paddingTop = Number(node.attrs.paddingTop ?? 12);
  const paddingBottom = Number(node.attrs.paddingBottom ?? 12);

  useEffect(() => {
    setRows(node.attrs.rows || []);
  }, [node.attrs.rows]);

  const save = (next: PriceRow[], extraAttrs: Record<string, unknown> = {}) => {
    setRows(next);
    updateAttributes({ rows: next, ...extraAttrs });
  };

  useEffect(() => {
    let cancelled = false;
    if (!catalogOpen || catalog.length) return;
    setLoadingCatalog(true);
    fetch('/api/products', withWorkspaceHeader({ cache: 'no-store' }))
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load products'))))
      .then((data: CatalogResponse) => {
        if (cancelled) return;
        const items = Array.isArray(data?.products) ? data.products : [];
        setCatalog(items.map((p) => ({
          id: p.id,
          name: p.name,
          currency: p.currency,
          basePrice: Number(p.basePrice) || 0,
        })));
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogOpen, catalog.length]);

  const totals = useMemo(() => {
    const sum = rows.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.price || 0) * (1 - Number(item.discount || 0) / 100)), 0);
    try {
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(sum || 0);
    } catch {
      return sum.toFixed(2);
    }
  }, [rows, currency]);

  const addRow = () => save([...rows, { ...defaultRow }]);

  const addFromCatalog = (product: CatalogProduct) => {
    const nextRows = [...rows, { name: product.name, qty: 1, price: product.basePrice, discount: 0 }];
    const nextCurrency = currency || product.currency;
    save(nextRows, { currency: nextCurrency });
    setCatalogOpen(false);
    setCatalogQuery('');
  };

  const currencyOptions = ['RUB', 'USD', 'EUR'];

  const filteredCatalog = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((product) =>
      [product.name, product.currency].some((field) => field.toLowerCase().includes(q)),
    );
  }, [catalog, catalogQuery]);

  const catalogModal = catalogOpen && typeof document !== 'undefined'
    ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Добавить из каталога</h3>
                <p className="text-xs text-slate-500">Выберите товар или откройте каталог для управления.</p>
              </div>
              <button
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-rose-400 hover:text-rose-600"
                type="button"
                onClick={() => setCatalogOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  placeholder="Поиск по названию или валюте"
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                />
                <a
                  href="/catalog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-violet-400 hover:text-violet-600"
                >
                  Открыть каталог
                </a>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto px-6 py-4">
              {loadingCatalog && <div className="text-sm text-slate-500">Загрузка каталога…</div>}
              {!loadingCatalog && filteredCatalog.length === 0 && (
                <div className="text-sm text-slate-500">Ничего не найдено.</div>
              )}
              {!loadingCatalog && filteredCatalog.length > 0 && (
                <ul className="space-y-2">
                  {filteredCatalog.map((product) => (
                    <li key={product.id}>
                      <button
                        type="button"
                        onClick={() => addFromCatalog(product)}
                        className="flex w-full flex-col rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition hover:border-violet-400 hover:bg-violet-50"
                      >
                        <span className="font-semibold text-slate-900">{product.name}</span>
                        <span className="text-xs text-slate-500">
                          {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: product.currency }).format(product.basePrice)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <NodeViewWrapper
      data-price-table
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop,
        paddingBottom,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <b>Таблица цен</b>
        <div>
          <label style={{ marginRight: 8 }}>
            Валюта:
            <select
              value={currency}
              onChange={(e) => updateAttributes({ currency: e.target.value })}
              style={{ marginLeft: 4 }}
            >
              {currencyOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <button onClick={addRow}>Добавить</button>
          <button onClick={() => setCatalogOpen((v) => !v)} style={{ marginLeft: 8 }}>Добавить из каталога</button>
          <button onClick={() => editor.commands.deleteSelection()} style={{ marginLeft: 8 }}>Удалить блок</button>
        </div>
      </div>

      {catalogModal}

      <table style={{ width: '100%', fontSize: 14 }}>
        <thead>
          <tr>
            <th>Позиция</th>
            <th>Кол-во</th>
            <th>Цена</th>
            <th>Скидка %</th>
            <th>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const sum = (Number(r.qty || 0) * Number(r.price || 0) * (1 - Number(r.discount || 0) / 100)) || 0;
            const updateRow = (patch: Partial<PriceRow>) => {
              const next = [...rows];
              next[i] = { ...next[i], ...patch };
              save(next);
            };

            const formatMoney = (value: number) => {
              try {
                return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(value || 0);
              } catch {
                return (value || 0).toFixed(2);
              }
            };

            return (
              <tr key={i}>
                <td>
                  <input
                    value={r.name || ''}
                    onChange={(e) => updateRow({ name: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={r.qty || 0}
                    min={0}
                    onChange={(e) => updateRow({ qty: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={r.price || 0}
                    min={0}
                    onChange={(e) => updateRow({ price: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={r.discount || 0}
                    min={0}
                    max={100}
                    onChange={(e) => updateRow({ discount: Number(e.target.value) })}
                  />
                </td>
                <td>{formatMoney(sum)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Итого</td>
            <td style={{ fontWeight: 600 }}>{totals}</td>
          </tr>
        </tfoot>
      </table>
    </NodeViewWrapper>
  );
}

export const PriceTable = PriceTableNode.extend({
  addNodeView() { return ReactNodeViewRenderer(PriceTableView); },
});
