import { describe, expect, it } from 'vitest';

import { renderProposalToHtml } from './renderProposal';
import type { Proposal } from '@/lib/types/proposal';

const baseProposal: Proposal = {
  workspaceId: 'workspace-1',
  title: 'Тестовое предложение',
  items: [],
  currency: 'RUB',
  includeVat: true,
  vatRate: 20,
  visibleSections: ['gallery'],
  galleryImages: ['https://example.com/image-1.jpg'],
  galleryTitle: 'Наши кейсы',
};

describe('renderProposalToHtml', () => {
  it('renders custom gallery title when provided', () => {
    const html = renderProposalToHtml({ proposal: baseProposal });

    expect(html).toContain('Наши кейсы');
    expect(html).toContain('grid-template-columns: repeat(2, 1fr);');
    expect(html).not.toContain('<div class="section-title">Примеры работ</div>');
  });

  it('hides gallery title when it is blank', () => {
    const html = renderProposalToHtml({
      proposal: {
        ...baseProposal,
        galleryTitle: '   ',
      },
    });

    expect(html).not.toContain('<div class="section-title">Примеры работ</div>');
    expect(html).not.toContain('<div class="section-title">   </div>');
  });
});
