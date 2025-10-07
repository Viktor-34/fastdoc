'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { withWorkspaceHeader } from '../../workspace-client';
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
  const currency = node.attrs.currency || 'RUB';

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
  };

  const currencyOptions = ['RUB', 'USD', 'EUR'];

  return (
    <div data-price-table style={{ border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
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

      {catalogOpen && (
        <div style={{ marginBottom: 8, border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
          {loadingCatalog && <div>Загрузка каталога…</div>}
          {!loadingCatalog && !catalog.length && <div>Каталог пуст. Добавьте товары через API.</div>}
          {!loadingCatalog && catalog.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {catalog.map((product) => (
                <button
                  key={product.id}
                  style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                  onClick={() => addFromCatalog(product)}
                  type="button"
                >
                  <div style={{ fontWeight: 600 }}>{product.name}</div>
                  <small>
                    {(() => {
                      try {
                        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: product.currency }).format(product.basePrice);
                      } catch {
                        return product.basePrice.toFixed(2);
                      }
                    })()}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}

export const PriceTable = PriceTableNode.extend({
  addNodeView() { return ReactNodeViewRenderer(PriceTableView); },
});
