import type { ProductVariant, ProductVariantRow, Proposal, ProposalItem } from '@/lib/types/proposal';
import {
  calculateItemTotal,
  calculateProposalSubtotal,
  getActiveVariant,
  getProposalItems,
  isProductVariantItemRow,
} from '@/lib/types/proposal';

interface RenderProposalOptions {
  proposal: Proposal;
  publicPreviewVariantTabsSpacerPx?: number;
  workspace?: {
    logoUrl?: string | null;
    signatureUrl?: string | null;
    stampUrl?: string | null;
    companyName?: string | null;
    inn?: string | null;
    ogrn?: string | null;
    legalAddress?: string | null;
    bankName?: string | null;
    bik?: string | null;
    accountNumber?: string | null;
  };
  client?: {
    name: string;
    email: string;
    company?: string | null;
    middleName?: string | null;
    position?: string | null;
  } | null;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatPrice(amount: number, currency: string = 'RUB'): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  };
  return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbols[currency] || currency}`;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getCurrencySymbol(currency: string = 'RUB'): string {
  const symbols: Record<string, string> = {
    RUB: '₽',
    USD: '$',
    EUR: '€',
  };
  return symbols[currency] || currency;
}

export function renderProposalToHtml(options: RenderProposalOptions): string {
  const { proposal, workspace, client } = options;
  const publicPreviewVariantTabsSpacerPx =
    typeof options.publicPreviewVariantTabsSpacerPx === 'number' &&
    Number.isFinite(options.publicPreviewVariantTabsSpacerPx) &&
    options.publicPreviewVariantTabsSpacerPx > 0
      ? Math.round(options.publicPreviewVariantTabsSpacerPx)
      : 0;

  const renderedItems = getProposalItems(proposal);
  const activeVariant = getActiveVariant(proposal);
  const showUnitColumn = proposal.productsView?.showUnitColumn !== false;
  const showDiscountColumn = proposal.productsView?.showDiscountColumn !== false;
  const tableColumnCount = 5 + (showUnitColumn ? 1 : 0) + (showDiscountColumn ? 1 : 0);
  const currencySymbol = getCurrencySymbol(proposal.currency);
  const variantRows: ProductVariantRow[] = Array.isArray(activeVariant?.rows) ? activeVariant.rows : [];
  const hasVariantRows = variantRows.length > 0;
  const allProductVariants: ProductVariant[] = Array.isArray(proposal.productVariants) ? proposal.productVariants : [];
  const variantsWithItems = allProductVariants.filter((variant) =>
    Array.isArray(variant.rows) && variant.rows.some((row) => isProductVariantItemRow(row)),
  );
  const hasProductsToRender = hasVariantRows || renderedItems.length > 0 || variantsWithItems.length > 0;
  const advantages = Array.isArray(proposal.advantages) ? proposal.advantages : [];
  const advantagesTitle =
    proposal.advantagesTitle == null
      ? 'Преимущества'
      : typeof proposal.advantagesTitle === 'string'
        ? proposal.advantagesTitle.trim()
        : '';
  const parsedAdvantagesColumns = Number(proposal.advantagesColumns);
  const advantagesColumns = Number.isFinite(parsedAdvantagesColumns)
    ? Math.min(3, Math.max(1, parsedAdvantagesColumns))
    : 3;
  const effectiveAdvantagesColumns = advantages.length >= 3 ? 3 : advantagesColumns;
  const visibleSections = Array.isArray(proposal.visibleSections)
    ? proposal.visibleSections
    : null;
  const isSectionVisible = (id: string) => !visibleSections || visibleSections.includes(id);

  const getVariantItemsForTotals = (rows: ProductVariantRow[]): ProposalItem[] =>
    rows.filter(isProductVariantItemRow).map((row) => ({
      id: row.id,
      productId: row.productId,
      name: row.name,
      description: row.description,
      qty: row.qty,
      price: row.price,
      discount: row.discount,
      unit: row.unit,
    }));

  const renderPriceTableRows = (rows: ProductVariantRow[], fallbackItems?: ProposalItem[]) => {
    const hasRows = rows.length > 0;

    if (hasRows) {
      let itemIndex = 0;
      return rows
        .map((row) => {
          if (!isProductVariantItemRow(row)) {
            return `
              <tr class="group-row">
                <td colspan="${tableColumnCount}">${escapeHtml(row.title || 'Группа')}</td>
              </tr>
            `;
          }

          itemIndex += 1;
          const item = row as ProposalItem;
          return `
            <tr>
              <td class="text-center">${itemIndex}</td>
              <td>
                <strong>${escapeHtml(item.name)}</strong>
                ${item.description ? `<br><small style="color: #666;">${escapeHtml(item.description)}</small>` : ''}
              </td>
              <td class="text-center">${item.qty}</td>
              ${showUnitColumn ? `<td class="text-center">${escapeHtml(item.unit || 'шт')}</td>` : ''}
              <td class="text-right">${formatAmount(item.price)}</td>
              ${showDiscountColumn ? `<td class="text-right">${item.discount ? `${item.discount}%` : '0%'}</td>` : ''}
              <td class="text-right"><strong>${formatAmount(calculateItemTotal(item))}</strong></td>
            </tr>
          `;
        })
        .join('');
    }

    return (fallbackItems ?? [])
      .map((item: ProposalItem, index: number) => `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.description ? `<br><small style="color: #666;">${escapeHtml(item.description)}</small>` : ''}
          </td>
          <td class="text-center">${item.qty}</td>
          ${showUnitColumn ? `<td class="text-center">${escapeHtml(item.unit || 'шт')}</td>` : ''}
          <td class="text-right">${formatAmount(item.price)}</td>
          ${showDiscountColumn ? `<td class="text-right">${item.discount ? `${item.discount}%` : '0%'}</td>` : ''}
          <td class="text-right"><strong>${formatAmount(calculateItemTotal(item))}</strong></td>
        </tr>
      `)
      .join('');
  };

  const renderTotalsBlock = (items: ProposalItem[]) => {
    const subtotal = calculateProposalSubtotal(items);
    const vatAmount = proposal.includeVat ? subtotal * (proposal.vatRate / 100) : 0;
    const total = subtotal + vatAmount;

    return `
      <div class="totals">
        <div class="totals-row">
          <span class="totals-label">Итого:</span>
          <span class="totals-value">${formatPrice(subtotal, proposal.currency)}</span>
        </div>
        ${proposal.includeVat ? `
          <div class="totals-row">
            <span class="totals-label">НДС ${proposal.vatRate}%:</span>
            <span class="totals-value">${formatPrice(vatAmount, proposal.currency)}</span>
          </div>
          <div class="totals-row total">
            <span class="totals-label">Всего с НДС:</span>
            <span class="totals-value">${formatPrice(total, proposal.currency)}</span>
          </div>
        ` : `
          <div class="totals-row total">
            <span class="totals-label">Всего:</span>
            <span class="totals-value">${formatPrice(subtotal, proposal.currency)}</span>
          </div>
        `}
      </div>
    `;
  };

  const renderVariantMeta = (variant: ProductVariant | null | undefined) => {
    if (!variant) return '';

    return `
      <div class="variant-meta">
        <div class="variant-name">
          ${escapeHtml(variant.name || 'Вариант')}
          ${variant.isRecommended ? '<span class="variant-badge">Рекомендуем</span>' : ''}
        </div>
        ${variant.description ? `<div class="variant-description">${escapeHtml(variant.description)}</div>` : ''}
      </div>
    `;
  };

  const renderProductsTable = ({
    rows,
    items,
  }: {
    rows: ProductVariantRow[];
    items: ProposalItem[];
  }) => `
    <table class="price-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Наименование</th>
          <th class="text-center">Кол-во</th>
          ${showUnitColumn ? '<th class="text-center">Ед.</th>' : ''}
          <th class="text-right">Цена, ${currencySymbol}</th>
          ${showDiscountColumn ? '<th class="text-right">Скидка</th>' : ''}
          <th class="text-right">Сумма, ${currencySymbol}</th>
        </tr>
      </thead>
      <tbody>
        ${renderPriceTableRows(rows, items)}
      </tbody>
    </table>
    ${renderTotalsBlock(items)}
  `;

  const renderVariantBody = (variant: ProductVariant) => {
    const rows = Array.isArray(variant.rows) ? variant.rows : [];
    const items = getVariantItemsForTotals(rows);

    if (items.length === 0) {
      return `
        ${renderVariantMeta(variant)}
        <div class="variant-empty">В этом варианте пока нет позиций.</div>
      `;
    }

    return `
      ${renderVariantMeta(variant)}
      ${renderProductsTable({ rows, items })}
    `;
  };

  const renderSingleProductsBody = () => {
    if (!hasProductsToRender) return '';

    const variantForSingleView =
      hasVariantRows
        ? activeVariant
        : variantsWithItems.length === 1
          ? variantsWithItems[0]
          : activeVariant;
    const singleVariantRows: ProductVariantRow[] =
      Array.isArray(variantForSingleView?.rows) ? variantForSingleView.rows : [];
    const singleVariantItems =
      singleVariantRows.length > 0 ? getVariantItemsForTotals(singleVariantRows) : renderedItems;

    return `
      ${variantForSingleView ? renderVariantMeta(variantForSingleView) : ''}
      ${renderProductsTable({ rows: singleVariantRows, items: singleVariantItems })}
    `;
  };

  const renderMultiVariantProducts = () => {
    if (variantsWithItems.length <= 1) return '';

    const preferredId =
      variantsWithItems.find((variant) => variant.id === activeVariant?.id)?.id ??
      variantsWithItems.find((variant) => variant.isRecommended)?.id ??
      variantsWithItems[0]?.id;

    const screenTabs = variantsWithItems
      .map((variant, index) => {
        const isActive = variant.id === preferredId;
        const panelId = `variant-panel-${index}`;
        const tabId = `variant-tab-${index}`;
        return `
          <button
            type="button"
            class="variant-tab${isActive ? ' is-active' : ''}"
            id="${tabId}"
            role="tab"
            aria-controls="${panelId}"
            aria-selected="${isActive ? 'true' : 'false'}"
            data-variant-tab
            data-target-panel="${panelId}"
          >
            <span>${escapeHtml(variant.name || `Вариант ${index + 1}`)}</span>
            ${variant.isRecommended ? '<span class="variant-tab-badge">Рекомендуем</span>' : ''}
          </button>
        `;
      })
      .join('');

    const screenPanels = variantsWithItems
      .map((variant, index) => {
        const isActive = variant.id === preferredId;
        const panelId = `variant-panel-${index}`;
        return `
          <div
            class="variant-panel${isActive ? ' is-active' : ''}"
            id="${panelId}"
            role="tabpanel"
            ${isActive ? '' : 'hidden'}
          >
            ${renderVariantBody(variant)}
          </div>
        `;
      })
      .join('');

    const printPanels = variantsWithItems
      .map((variant) => `
        <div class="variant-print-block">
          ${renderVariantBody(variant)}
        </div>
      `)
      .join('');

    return `
      <div class="screen-only" data-variant-tabs-container>
        <div class="variant-tabs" role="tablist" aria-label="Варианты предложения">
          ${screenTabs}
        </div>
        <div class="variant-panels">
          ${screenPanels}
        </div>
      </div>
      <div class="print-only">
        <div class="variant-print-stack">
          ${printPanels}
        </div>
      </div>
    `;
  };

  const renderProductsSection = () => {
    if (!isSectionVisible('products') || !hasProductsToRender) return '';
    const multiVariantMarkup = renderMultiVariantProducts();
    const publicPreviewTabsAnchorMarkup = publicPreviewVariantTabsSpacerPx > 0 ? `
      <div
        class="public-preview-variant-tabs-anchor screen-only"
        data-public-preview-variant-tabs-anchor
        style="height: ${publicPreviewVariantTabsSpacerPx}px;"
        aria-hidden="true"
      ></div>
    ` : '';

    return `${publicPreviewTabsAnchorMarkup}${multiVariantMarkup || renderSingleProductsBody()}`;
  };

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(proposal.title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      background: #ffffff;
    }
    
    @media print {
      body {
        padding: 0;
      }

      .screen-only {
        display: none !important;
      }

      .print-only {
        display: block !important;
      }

      .variant-print-block {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
    
    @page {
      size: A4;
      margin: 20mm 15mm;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    
    .logo {
      max-width: 200px;
      max-height: 80px;
    }
    
    .company-info {
      text-align: right;
      font-size: 12px;
      color: #666;
    }
    
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #333;
    }
    
    .section-content {
      font-size: 14px;
      line-height: 1.8;
      color: #444;
      white-space: pre-wrap;
    }

    .advantages-grid {
      display: grid;
      grid-template-columns: repeat(var(--advantages-columns, 3), minmax(0, 1fr));
      gap: 12px;
      margin-top: 10px;
    }

    .advantage-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px;
      background: #fafafa;
      min-height: 130px;
    }

    .advantage-icon {
      width: 42px;
      height: 42px;
      border-radius: 9999px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f0f0;
      margin-bottom: 10px;
      font-size: 18px;
    }

    .advantage-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .advantage-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 6px;
      line-height: 1.3;
    }

    .advantage-description {
      font-size: 12px;
      line-height: 1.45;
      color: #4b5563;
      white-space: pre-wrap;
    }
    
    .price-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 13px;
    }
    
    .price-table th {
      background-color: #f5f5f5;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      border: 1px solid #ddd;
    }
    
    .price-table td {
      padding: 10px;
      border: 1px solid #ddd;
    }
    
    .price-table tr:nth-child(even) {
      background-color: #fafafa;
    }
    
    .price-table .text-right {
      text-align: right;
    }
    
    .price-table .text-center {
      text-align: center;
    }

    .price-table .group-row td {
      background-color: #f3f2f0;
      font-weight: 600;
      color: #3d3d3a;
    }

    .variant-meta {
      margin: 12px 0 8px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #f7f6f3;
      border: 1px solid #e6e4de;
    }

    .variant-name {
      font-size: 13px;
      font-weight: 600;
      color: #252525;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .variant-badge {
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      background: #3cb371;
      color: #fff;
    }

    .variant-description {
      margin-top: 6px;
      font-size: 12px;
      color: #666;
      white-space: pre-wrap;
    }

    .screen-only {
      display: block;
    }

    .print-only {
      display: none;
    }

    .variant-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0 12px;
    }

    .variant-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 12px 18px;
      border-radius: 9999px;
      border: 1px solid #d9d7d2;
      background: #fff;
      color: #3d3d3a;
      font-size: 15px;
      font-weight: 400;
      cursor: pointer;
    }

    .variant-tab.is-active {
      border-color: #3d3d3a;
      background: #3d3d3a;
      color: #fff;
    }

    .variant-tab-badge {
      padding: 1px 6px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 600;
      background: rgba(60, 179, 113, 0.16);
      color: #1d6b44;
    }

    .variant-tab.is-active .variant-tab-badge {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }

    .variant-panel[hidden] {
      display: none !important;
    }

    .variant-panel,
    .variant-print-block {
      margin-top: 2px;
    }

    .variant-print-block + .variant-print-block {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px dashed #d9d7d2;
    }

    .variant-empty {
      margin-top: 8px;
      padding: 12px;
      border: 1px dashed #d9d7d2;
      border-radius: 8px;
      color: #666;
      font-size: 12px;
      background: #fafafa;
    }

    .public-preview-variant-tabs-anchor {
      width: 100%;
    }
    
    .totals {
      margin-top: 10px;
      text-align: right;
    }
    
    .totals-row {
      display: flex;
      justify-content: flex-end;
      padding: 5px 0;
      font-size: 14px;
    }
    
    .totals-row.total {
      font-size: 18px;
      font-weight: 700;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #333;
    }
    
    .totals-label {
      margin-right: 20px;
    }
    
    .totals-value {
      min-width: 150px;
      text-align: right;
      font-weight: 600;
    }
    
    .terms {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    
    .term-item {
      font-size: 13px;
    }
    
    .term-label {
      font-weight: 600;
      color: #666;
      margin-bottom: 5px;
    }
    
    .term-value {
      color: #333;
    }
    
    .gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    
    .gallery img {
      width: 100%;
      height: auto;
      border-radius: 8px;
      object-fit: cover;
    }
    
    .cta {
      margin: 30px 0;
      padding: 20px;
      background-color: #f0f0f0;
      border-radius: 8px;
      text-align: center;
    }
    
    .cta-text {
      font-size: 15px;
      margin-bottom: 15px;
    }
    
    .cta-contacts {
      font-size: 14px;
      font-weight: 600;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #666;
    }
    
    .requisites {
      margin-bottom: 20px;
    }
    
    .requisites-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-top: 10px;
    }
    
    .signatures {
      display: flex;
      justify-content: flex-end;
      gap: 30px;
      margin-top: 30px;
    }
    
    .signature-item img {
      max-width: 150px;
      max-height: 80px;
    }
  </style>
</head>
<body>
  <!-- Шапка -->
  <div class="header">
    <div>
      ${workspace?.logoUrl ? `<img src="${escapeHtml(workspace.logoUrl)}" alt="Logo" class="logo">` : ''}
    </div>
    <div class="company-info">
      ${workspace?.companyName ? `<div><strong>${escapeHtml(workspace.companyName)}</strong></div>` : ''}
      ${workspace?.inn ? `<div>ИНН: ${escapeHtml(workspace.inn)}</div>` : ''}
    </div>
  </div>

  <!-- Заголовок -->
  ${isSectionVisible('basic') && proposal.title ? `<h1>${escapeHtml(proposal.title)}</h1>` : ''}

  <!-- Обращение -->
  ${isSectionVisible('basic') && proposal.recipientName ? `<div class="greeting">${escapeHtml(proposal.recipientName)}</div>` : ''}

  <!-- Описание проблемы (Point A) -->
  ${isSectionVisible('context') && proposal.problemDesc ? `
    <div class="section">
      <div class="section-content">${escapeHtml(proposal.problemDesc)}</div>
    </div>
  ` : ''}

  <!-- Предлагаемое решение (Point B) -->
  ${isSectionVisible('context') && proposal.solutionDesc ? `
    <div class="section">
      <div class="section-content">${escapeHtml(proposal.solutionDesc)}</div>
    </div>
  ` : ''}

  <!-- Дополнительное описание -->
  ${isSectionVisible('context') && proposal.additionalDesc ? `
    <div class="section">
      <div class="section-content">${escapeHtml(proposal.additionalDesc)}</div>
    </div>
  ` : ''}

  <!-- Преимущества -->
  ${isSectionVisible('advantages') && advantages.length > 0 ? `
    <div class="section">
      ${advantagesTitle ? `<div class="section-title">${escapeHtml(advantagesTitle)}</div>` : ''}
      <div class="advantages-grid" style="--advantages-columns: ${effectiveAdvantagesColumns}">
        ${advantages.map((item) => `
          <div class="advantage-card">
            <div class="advantage-icon">
              ${item.iconUrl ? `<img src="${escapeHtml(item.iconUrl)}" alt="Иконка преимущества">` : '★'}
            </div>
            <div class="advantage-title">${escapeHtml(item.title || 'Без названия')}</div>
            <div class="advantage-description">${escapeHtml(item.description || '')}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}

  <!-- Таблица товаров/услуг -->
  ${renderProductsSection()}

  <!-- Условия -->
  ${isSectionVisible('terms') && (proposal.deadline || proposal.paymentTerms || proposal.validUntil) ? `
    <div class="terms">
      ${proposal.deadline ? `
        <div class="term-item">
          <div class="term-label">Срок выполнения:</div>
          <div class="term-value">${escapeHtml(proposal.deadline)}</div>
        </div>
      ` : ''}
      ${proposal.paymentTerms ? `
        <div class="term-item">
          <div class="term-label">Условия оплаты:</div>
          <div class="term-value">${
            proposal.paymentTerms === 'prepaid' ? '100% предоплата' :
            proposal.paymentTerms === '50-50' ? '50% предоплата / 50% по завершении' :
            proposal.paymentTerms === 'postpaid' ? 'Постоплата' :
            proposal.paymentCustom ? escapeHtml(proposal.paymentCustom) : escapeHtml(proposal.paymentTerms)
          }</div>
        </div>
      ` : ''}
      ${proposal.validUntil ? `
        <div class="term-item">
          <div class="term-label">Срок действия предложения:</div>
          <div class="term-value">${new Date(proposal.validUntil).toLocaleDateString('ru-RU')}</div>
        </div>
      ` : ''}
    </div>
  ` : ''}

  <!-- Галерея -->
  ${isSectionVisible('gallery') && proposal.galleryImages && proposal.galleryImages.length > 0 ? `
    <div class="section">
      <div class="section-title">Примеры работ</div>
      <div class="gallery">
        ${proposal.galleryImages.map((url: string) => `<img src="${escapeHtml(url)}" alt="Portfolio image">`).join('')}
      </div>
    </div>
  ` : ''}

  <!-- CTA -->
  ${isSectionVisible('contacts') && (proposal.ctaText || proposal.ctaPhone || proposal.ctaEmail) ? `
    <div class="cta">
      ${proposal.ctaText ? `<div class="cta-text">${escapeHtml(proposal.ctaText)}</div>` : ''}
      <div class="cta-contacts">
        ${proposal.ctaPhone ? `📞 ${escapeHtml(proposal.ctaPhone)}` : ''}
        ${proposal.ctaPhone && proposal.ctaEmail ? ' • ' : ''}
        ${proposal.ctaEmail ? `✉️ ${escapeHtml(proposal.ctaEmail)}` : ''}
      </div>
    </div>
  ` : ''}

  <!-- Примечания -->
  ${isSectionVisible('terms') && proposal.notes ? `
    <div class="section">
      <div class="section-title">Примечания</div>
      <div class="section-content">${escapeHtml(proposal.notes)}</div>
    </div>
  ` : ''}

  <!-- Футер с реквизитами -->
  ${workspace ? `
    <div class="footer">
      <div class="requisites">
        <div><strong>Реквизиты:</strong></div>
        <div class="requisites-grid">
          ${workspace.companyName ? `<div>Наименование: ${escapeHtml(workspace.companyName)}</div>` : ''}
          ${workspace.inn ? `<div>ИНН: ${escapeHtml(workspace.inn)}</div>` : ''}
          ${workspace.ogrn ? `<div>ОГРН: ${escapeHtml(workspace.ogrn)}</div>` : ''}
          ${workspace.legalAddress ? `<div style="grid-column: 1 / -1;">Юр. адрес: ${escapeHtml(workspace.legalAddress)}</div>` : ''}
          ${workspace.bankName ? `<div>Банк: ${escapeHtml(workspace.bankName)}</div>` : ''}
          ${workspace.bik ? `<div>БИК: ${escapeHtml(workspace.bik)}</div>` : ''}
          ${workspace.accountNumber ? `<div style="grid-column: 1 / -1;">Р/С: ${escapeHtml(workspace.accountNumber)}</div>` : ''}
        </div>
      </div>
      
      ${workspace.signatureUrl || workspace.stampUrl ? `
        <div class="signatures">
          ${workspace.signatureUrl ? `
            <div class="signature-item">
              <img src="${escapeHtml(workspace.signatureUrl)}" alt="Подпись">
            </div>
          ` : ''}
          ${workspace.stampUrl ? `
            <div class="signature-item">
              <img src="${escapeHtml(workspace.stampUrl)}" alt="Печать">
            </div>
          ` : ''}
        </div>
      ` : ''}
    </div>
  ` : ''}

  <script>
    function sendPublicPreviewVariantTabsAnchor() {
      if (window.parent === window) return;
      const anchor = document.querySelector('[data-public-preview-variant-tabs-anchor]');
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      if (!Number.isFinite(top)) return;
      window.parent.postMessage({ type: 'public-preview-variant-tabs-anchor', top: top }, '*');
    }

    function sendHeight() {
      if (window.parent === window) return;
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'resize', height: height }, '*');
      sendPublicPreviewVariantTabsAnchor();
    }

    function initVariantTabs() {
      document.querySelectorAll('[data-variant-tabs-container]').forEach((container) => {
        if (container.getAttribute('data-variant-tabs-bound') === '1') return;
        container.setAttribute('data-variant-tabs-bound', '1');

        container.querySelectorAll('[data-variant-tab]').forEach((button) => {
          button.addEventListener('pointerdown', (event) => {
            // В iframe первый клик по фокусируемому элементу может прокрутить родительскую страницу
            // к началу iframe. Оставляем клавиатурную фокусировку, но убираем mouse-focus.
            event.preventDefault();
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'variant-tab-interaction-start' }, '*');
            }
          });

          button.addEventListener('click', () => {
            const targetPanelId = button.getAttribute('data-target-panel');
            if (!targetPanelId) return;
            let parentScroll = null;
            if (window.parent !== window) {
              try {
                parentScroll = { x: window.parent.scrollX, y: window.parent.scrollY };
              } catch (error) {
                parentScroll = null;
              }
            }

            container.querySelectorAll('[data-variant-tab]').forEach((tab) => {
              const isActive = tab === button;
              tab.classList.toggle('is-active', isActive);
              tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            });

            container.querySelectorAll('.variant-panel').forEach((panel) => {
              const isActive = panel.id === targetPanelId;
              panel.classList.toggle('is-active', isActive);
              if (isActive) {
                panel.removeAttribute('hidden');
              } else {
                panel.setAttribute('hidden', '');
              }
            });

            if (typeof button.blur === 'function') {
              button.blur();
            }
            if (window.parent !== window) {
              window.parent.postMessage({ type: 'variant-tab-activated' }, '*');
            }
            if (parentScroll && window.parent !== window) {
              const restoreParentScroll = () => {
                try {
                  window.parent.scrollTo(parentScroll.x, parentScroll.y);
                } catch (error) {
                  // ignore cross-context scroll errors
                }
              };
              restoreParentScroll();
              requestAnimationFrame(restoreParentScroll);
              setTimeout(restoreParentScroll, 40);
              setTimeout(restoreParentScroll, 140);
              setTimeout(restoreParentScroll, 280);
            }
            setTimeout(sendHeight, 0);
          });
        });
      });
    }

    initVariantTabs();
    window.addEventListener('load', sendHeight);
    window.addEventListener('resize', sendHeight);
    // Отправляем высоту сразу
    setTimeout(sendHeight, 100);
    setTimeout(sendPublicPreviewVariantTabsAnchor, 120);
  </script>
</body>
</html>`;
}
