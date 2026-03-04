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

  it('renders compact branded header and signoff footer layout', () => {
    const html = renderProposalToHtml({
      proposal: baseProposal,
      workspace: {
        logoUrl: 'https://example.com/logo.png',
        signatureUrl: 'https://example.com/signature.png',
        stampUrl: 'https://example.com/stamp.png',
        companyName: 'СТРОЙ-ЭКСПЕРТ',
        inn: '1234567890',
        ogrn: '1234567890123',
        legalAddress: 'Москва, ул. Примерная, д. 1',
        signatoryRole: 'Генеральный директор',
        signatoryName: 'Иванов И.И.',
      },
    });

    const innMatches = html.match(/ИНН: 1234567890/g) ?? [];

    expect(html).toContain('<div class="company-name">СТРОЙ-ЭКСПЕРТ</div>');
    expect(innMatches).toHaveLength(1);
    expect(html).toContain('<div class="signoff-role">Генеральный директор</div>');
    expect(html).toContain('class="signature-line"');
    expect(html).toContain('class="stamp-image"');
    expect(html).toContain('<div class="signoff-name">Иванов И.И.</div>');
  });
});
