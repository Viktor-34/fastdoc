import { describe, expect, it } from 'vitest';
import {
  rebaseTemplateIds,
  sanitizeTemplateDefaults,
  sanitizeTemplateSections,
} from './mapping';

describe('sanitizeTemplateDefaults', () => {
  it('keeps only allowed proposal fields', () => {
    const sanitized = sanitizeTemplateDefaults({
      title: 'Не должно попасть',
      clientId: 'client-1',
      ctaPhone: '+79990000000',
      problemDesc: 'Описание проблемы',
      includeVat: true,
      vatRate: 20,
      notes: 'Комментарий',
    });

    expect(sanitized).toEqual({
      problemDesc: 'Описание проблемы',
      includeVat: true,
      vatRate: 20,
      notes: 'Комментарий',
    });
  });
});

describe('sanitizeTemplateSections', () => {
  it('filters unknown sections and removes duplicates', () => {
    const sections = sanitizeTemplateSections(['basic', 'products', 'unknown', 'products', 123] as unknown[]);
    expect(sections).toEqual(['basic', 'products']);
  });

  it('falls back to all sections when input is invalid', () => {
    const sections = sanitizeTemplateSections(null);
    expect(sections).toEqual(['basic', 'context', 'advantages', 'products', 'terms', 'gallery', 'contacts']);
  });
});

describe('rebaseTemplateIds', () => {
  it('rebases product/row ids and preserves row-group links', () => {
    const rebased = rebaseTemplateIds({
      activeVariantId: 'variant-1',
      productVariants: [
        {
          id: 'variant-1',
          name: 'Базовый',
          rows: [
            { type: 'group', id: 'group-1', title: 'Пакет' },
            {
              type: 'item',
              id: 'item-1',
              groupId: 'group-1',
              name: 'Услуга',
              qty: 1,
              price: 1000,
              discount: 0,
            },
          ],
        },
      ],
      advantages: [
        { id: 'adv-1', title: 'Плюс', description: 'Описание' },
      ],
      items: [
        {
          id: 'legacy-item-1',
          name: 'Legacy',
          qty: 1,
          price: 500,
        },
      ],
    });

    const variant = rebased.productVariants?.[0];
    expect(variant).toBeDefined();
    expect(variant?.id).not.toBe('variant-1');
    expect(rebased.activeVariantId).toBe(variant?.id);

    const groupRow = variant?.rows[0];
    const itemRow = variant?.rows[1];
    if (!groupRow || !itemRow || groupRow.type !== 'group' || itemRow.type !== 'item') {
      throw new Error('Rows were rebased into unexpected shape');
    }

    expect(groupRow.id).not.toBe('group-1');
    expect(itemRow.id).not.toBe('item-1');
    expect(itemRow.groupId).toBe(groupRow.id);

    expect(rebased.advantages?.[0]?.id).not.toBe('adv-1');
    expect(rebased.items?.[0]?.id).not.toBe('legacy-item-1');
  });
});
