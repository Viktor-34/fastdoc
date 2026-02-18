module.exports=[9955,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/p/[token]/PublicPreviewClient.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/p/[token]/PublicPreviewClient.tsx <module evaluation>","default")},10243,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/p/[token]/PublicPreviewClient.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/p/[token]/PublicPreviewClient.tsx","default")},13638,a=>{"use strict";a.i(9955);var b=a.i(10243);a.n(b)},37483,a=>{"use strict";a.s(["default",()=>o,"generateMetadata",()=>n],37483);var b=a.i(7997);a.i(70396);var c=a.i(73727),d=a.i(1241);function e(a){return"item"===a.type}function f(a){if("variants"!==a.pricingMode||!Array.isArray(a.productVariants)||0===a.productVariants.length)return null;if(a.activeVariantId){let b=a.productVariants.find(b=>b.id===a.activeVariantId);if(b)return b}return a.productVariants.find(a=>a.isRecommended)??a.productVariants[0]}function g(a){let b=f(a);if(b)return b?b.rows.filter(e).map(a=>({id:a.id,productId:a.productId,name:a.name,description:a.description,qty:a.qty,price:a.price,discount:a.discount,unit:a.unit})):[];return Array.isArray(a.items)?a.items:[]}function h(a){let b=a.qty*a.price;return a.discount&&a.discount>0?b*(1-a.discount/100):b}function i(a){return a.reduce((a,b)=>a+h(b),0)}function j(a){let b={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return a.replace(/[&<>"']/g,a=>b[a])}function k(a,b="RUB"){return`${a.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})} ${({RUB:"₽",USD:"$",EUR:"€"})[b]||b}`}function l(a){return a.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}var m=a.i(13638);async function n({params:a}){let{token:b}=await a,c=await d.prisma.shareLink.findUnique({where:{token:b},include:{Proposal:{include:{Client:{select:{name:!0,email:!0,company:!0}},Workspace:{select:{name:!0,logoUrl:!0,companyName:!0}}}}}});return!c||c.expiresAt&&c.expiresAt<new Date?{title:"Предложение не найдено",description:"Запрошенное предложение не существует или срок его действия истек."}:c.Proposal?{title:c.Proposal.title,description:c.Proposal.problemDesc||c.Proposal.solutionDesc||"Коммерческое предложение",robots:{index:!1,follow:!1}}:{title:"Предложение не найдено",description:"Запрошенное предложение не существует."}}async function o({params:a}){let{token:n}=await a,o=await d.prisma.shareLink.findUnique({where:{token:n},include:{Proposal:{include:{Client:{select:{name:!0,email:!0,company:!0,middleName:!0,position:!0}},Workspace:{select:{name:!0,logoUrl:!0,signatureUrl:!0,stampUrl:!0,companyName:!0,inn:!0,ogrn:!0,legalAddress:!0,bankName:!0,bik:!0,accountNumber:!0}}}}}});if(!o||o.expiresAt&&o.expiresAt<new Date||!o.Proposal)return(0,c.notFound)();d.prisma.shareLink.update({where:{token:n},data:{viewCount:{increment:1},lastViewedAt:new Date}}).catch(a=>console.error("Failed to update view count:",a));let p="";if(o.Proposal){let a=Array.isArray(o.Proposal.items)?o.Proposal.items:[],b=Array.isArray(o.Proposal.galleryImages)?o.Proposal.galleryImages:[],c="draft"===o.Proposal.status||"sent"===o.Proposal.status||"accepted"===o.Proposal.status||"rejected"===o.Proposal.status?o.Proposal.status:"draft",d="variants"===o.Proposal.pricingMode?"variants":"single";p=function(a){let b,{proposal:c,workspace:d,client:m}=a,n=g(c),o=f(c),p=c.productsView?.showUnitColumn!==!1,q=c.productsView?.showDiscountColumn!==!1,r=5+ +!!p+ +!!q,s=function(a="RUB"){return({RUB:"₽",USD:"$",EUR:"€"})[a]||a}(c.currency),t=Array.isArray(o?.rows)?o.rows:[],u=t.length>0,v=u||n.length>0,w=i(n),x=c.includeVat&&0!==c.vatRate?i(g(c))*(c.vatRate/100):0,y=function(a){let b=i(g(a));return a.includeVat&&a.vatRate>0?b*(1+a.vatRate/100):b}(c),z=Array.isArray(c.advantages)?c.advantages:[],A="number"==typeof c.advantagesColumns?Math.min(3,Math.max(1,c.advantagesColumns)):3,B=z.length>=3?3:A,C=Array.isArray(c.visibleSections)?c.visibleSections:null,D=a=>!C||C.includes(a);return`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${j(c.title)}</title>
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
      ${d?.logoUrl?`<img src="${j(d.logoUrl)}" alt="Logo" class="logo">`:""}
    </div>
    <div class="company-info">
      ${d?.companyName?`<div><strong>${j(d.companyName)}</strong></div>`:""}
      ${d?.inn?`<div>ИНН: ${j(d.inn)}</div>`:""}
    </div>
  </div>

  <!-- Заголовок -->
  ${D("basic")&&c.title?`<h1>${j(c.title)}</h1>`:""}

  <!-- Обращение -->
  ${D("basic")&&c.recipientName?`<div class="greeting">${j(c.recipientName)}</div>`:""}

  <!-- Описание проблемы (Point A) -->
  ${D("context")&&c.problemDesc?`
    <div class="section">
      <div class="section-content">${j(c.problemDesc)}</div>
    </div>
  `:""}

  <!-- Предлагаемое решение (Point B) -->
  ${D("context")&&c.solutionDesc?`
    <div class="section">
      <div class="section-content">${j(c.solutionDesc)}</div>
    </div>
  `:""}

  <!-- Дополнительное описание -->
  ${D("context")&&c.additionalDesc?`
    <div class="section">
      <div class="section-content">${j(c.additionalDesc)}</div>
    </div>
  `:""}

  <!-- Преимущества -->
  ${D("advantages")&&z.length>0?`
    <div class="section">
      <div class="section-title">Преимущества</div>
      <div class="advantages-grid" style="--advantages-columns: ${B}">
        ${z.map(a=>`
          <div class="advantage-card">
            <div class="advantage-icon">
              ${a.iconUrl?`<img src="${j(a.iconUrl)}" alt="Иконка преимущества">`:"★"}
            </div>
            <div class="advantage-title">${j(a.title||"Без названия")}</div>
            <div class="advantage-description">${j(a.description||"")}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `:""}

  <!-- Таблица товаров/услуг -->
  ${D("products")&&v?`
    ${o?`
      <div class="variant-meta">
        <div class="variant-name">
          ${j(o.name)}
          ${o.isRecommended?'<span class="variant-badge">Рекомендуем</span>':""}
        </div>
        ${o.description?`<div class="variant-description">${j(o.description)}</div>`:""}
      </div>
    `:""}
    <table class="price-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Наименование</th>
          <th class="text-center">Кол-во</th>
          ${p?'<th class="text-center">Ед.</th>':""}
          <th class="text-right">Цена, ${s}</th>
          ${q?'<th class="text-right">Скидка</th>':""}
          <th class="text-right">Сумма, ${s}</th>
        </tr>
      </thead>
      <tbody>
        ${u?(b=0,t.map(a=>e(a)?(b+=1,`
                <tr>
                  <td class="text-center">${b}</td>
                  <td>
                    <strong>${j(a.name)}</strong>
                    ${a.description?`<br><small style="color: #666;">${j(a.description)}</small>`:""}
                  </td>
                  <td class="text-center">${a.qty}</td>
                  ${p?`<td class="text-center">${j(a.unit||"шт")}</td>`:""}
                  <td class="text-right">${l(a.price)}</td>
                  ${q?`<td class="text-right">${a.discount?`${a.discount}%`:"0%"}</td>`:""}
                  <td class="text-right"><strong>${l(h(a))}</strong></td>
                </tr>
              `):`
                  <tr class="group-row">
                    <td colspan="${r}">${j(a.title||"Группа")}</td>
                  </tr>
                `).join("")):n.map((a,b)=>`
          <tr>
            <td class="text-center">${b+1}</td>
            <td>
              <strong>${j(a.name)}</strong>
              ${a.description?`<br><small style="color: #666;">${j(a.description)}</small>`:""}
            </td>
            <td class="text-center">${a.qty}</td>
            ${p?`<td class="text-center">${j(a.unit||"шт")}</td>`:""}
            <td class="text-right">${l(a.price)}</td>
            ${q?`<td class="text-right">${a.discount?`${a.discount}%`:"0%"}</td>`:""}
            <td class="text-right"><strong>${l(h(a))}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Итоги -->
    <div class="totals">
      <div class="totals-row">
        <span class="totals-label">Итого:</span>
        <span class="totals-value">${k(w,c.currency)}</span>
      </div>
      ${c.includeVat?`
        <div class="totals-row">
          <span class="totals-label">НДС ${c.vatRate}%:</span>
          <span class="totals-value">${k(x,c.currency)}</span>
        </div>
        <div class="totals-row total">
          <span class="totals-label">Всего с НДС:</span>
          <span class="totals-value">${k(y,c.currency)}</span>
        </div>
      `:`
        <div class="totals-row total">
          <span class="totals-label">Всего:</span>
          <span class="totals-value">${k(y,c.currency)}</span>
        </div>
      `}
    </div>
  `:""}

  <!-- Условия -->
  ${D("terms")&&(c.deadline||c.paymentTerms||c.validUntil)?`
    <div class="terms">
      ${c.deadline?`
        <div class="term-item">
          <div class="term-label">Срок выполнения:</div>
          <div class="term-value">${j(c.deadline)}</div>
        </div>
      `:""}
      ${c.paymentTerms?`
        <div class="term-item">
          <div class="term-label">Условия оплаты:</div>
          <div class="term-value">${"prepaid"===c.paymentTerms?"100% предоплата":"50-50"===c.paymentTerms?"50% предоплата / 50% по завершении":"postpaid"===c.paymentTerms?"Постоплата":c.paymentCustom?j(c.paymentCustom):j(c.paymentTerms)}</div>
        </div>
      `:""}
      ${c.validUntil?`
        <div class="term-item">
          <div class="term-label">Срок действия предложения:</div>
          <div class="term-value">${new Date(c.validUntil).toLocaleDateString("ru-RU")}</div>
        </div>
      `:""}
    </div>
  `:""}

  <!-- Галерея -->
  ${D("gallery")&&c.galleryImages&&c.galleryImages.length>0?`
    <div class="section">
      <div class="section-title">Примеры работ</div>
      <div class="gallery">
        ${c.galleryImages.map(a=>`<img src="${j(a)}" alt="Portfolio image">`).join("")}
      </div>
    </div>
  `:""}

  <!-- CTA -->
  ${D("contacts")&&(c.ctaText||c.ctaPhone||c.ctaEmail)?`
    <div class="cta">
      ${c.ctaText?`<div class="cta-text">${j(c.ctaText)}</div>`:""}
      <div class="cta-contacts">
        ${c.ctaPhone?`📞 ${j(c.ctaPhone)}`:""}
        ${c.ctaPhone&&c.ctaEmail?" • ":""}
        ${c.ctaEmail?`✉️ ${j(c.ctaEmail)}`:""}
      </div>
    </div>
  `:""}

  <!-- Примечания -->
  ${D("terms")&&c.notes?`
    <div class="section">
      <div class="section-title">Примечания</div>
      <div class="section-content">${j(c.notes)}</div>
    </div>
  `:""}

  <!-- Футер с реквизитами -->
  ${d?`
    <div class="footer">
      <div class="requisites">
        <div><strong>Реквизиты:</strong></div>
        <div class="requisites-grid">
          ${d.companyName?`<div>Наименование: ${j(d.companyName)}</div>`:""}
          ${d.inn?`<div>ИНН: ${j(d.inn)}</div>`:""}
          ${d.ogrn?`<div>ОГРН: ${j(d.ogrn)}</div>`:""}
          ${d.legalAddress?`<div style="grid-column: 1 / -1;">Юр. адрес: ${j(d.legalAddress)}</div>`:""}
          ${d.bankName?`<div>Банк: ${j(d.bankName)}</div>`:""}
          ${d.bik?`<div>БИК: ${j(d.bik)}</div>`:""}
          ${d.accountNumber?`<div style="grid-column: 1 / -1;">Р/С: ${j(d.accountNumber)}</div>`:""}
        </div>
      </div>
      
      ${d.signatureUrl||d.stampUrl?`
        <div class="signatures">
          ${d.signatureUrl?`
            <div class="signature-item">
              <img src="${j(d.signatureUrl)}" alt="Подпись">
            </div>
          `:""}
          ${d.stampUrl?`
            <div class="signature-item">
              <img src="${j(d.stampUrl)}" alt="Печать">
            </div>
          `:""}
        </div>
      `:""}
    </div>
  `:""}

  <script>
    // Автоматическая высота для iframe
    if (window.parent !== window) {
      function sendHeight() {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'resize', height: height }, '*');
      }
      window.addEventListener('load', sendHeight);
      window.addEventListener('resize', sendHeight);
      // Отправляем высоту сразу
      setTimeout(sendHeight, 100);
    }
  </script>
</body>
</html>`}({proposal:{...o.Proposal,items:a,pricingMode:d,productVariants:Array.isArray(o.Proposal.productVariants)?o.Proposal.productVariants:[],activeVariantId:o.Proposal.activeVariantId??void 0,productsView:o.Proposal.productsView&&"object"==typeof o.Proposal.productsView?o.Proposal.productsView:void 0,galleryImages:b,advantages:Array.isArray(o.Proposal.advantages)?o.Proposal.advantages:[],advantagesColumns:"number"==typeof o.Proposal.advantagesColumns?Math.min(3,Math.max(1,o.Proposal.advantagesColumns)):3,status:c,clientId:o.Proposal.clientId??void 0,recipientName:o.Proposal.recipientName??void 0,problemDesc:o.Proposal.problemDesc??void 0,solutionDesc:o.Proposal.solutionDesc??void 0,additionalDesc:o.Proposal.additionalDesc??void 0,deadline:o.Proposal.deadline??void 0,paymentTerms:o.Proposal.paymentTerms??void 0,paymentCustom:o.Proposal.paymentCustom??void 0,validUntil:o.Proposal.validUntil??void 0,visibleSections:Array.isArray(o.Proposal.visibleSections)?o.Proposal.visibleSections:void 0,ctaText:o.Proposal.ctaText??void 0,ctaPhone:o.Proposal.ctaPhone??void 0,ctaEmail:o.Proposal.ctaEmail??void 0,notes:o.Proposal.notes??void 0},workspace:o.Proposal.Workspace||void 0,client:o.Proposal.Client||void 0})}return(0,b.jsx)(m.default,{token:n,proposalHtml:p})}}];

//# sourceMappingURL=app_p_%5Btoken%5D_aae9ef59._.js.map