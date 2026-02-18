module.exports=[60526,(t,e,i)=>{e.exports=t.x("node:os",()=>require("node:os"))},50227,(t,e,i)=>{e.exports=t.x("node:path",()=>require("node:path"))},12714,(t,e,i)=>{e.exports=t.x("node:fs/promises",()=>require("node:fs/promises"))},2157,(t,e,i)=>{e.exports=t.x("node:fs",()=>require("node:fs"))},55210,4531,83903,t=>{"use strict";function e(t){return"item"===t.type}function i(t){if("variants"!==t.pricingMode||!Array.isArray(t.productVariants)||0===t.productVariants.length)return null;if(t.activeVariantId){let e=t.productVariants.find(e=>e.id===t.activeVariantId);if(e)return e}return t.productVariants.find(t=>t.isRecommended)??t.productVariants[0]}function a(t){let a=i(t);if(a)return a?a.rows.filter(e).map(t=>({id:t.id,productId:t.productId,name:t.name,description:t.description,qty:t.qty,price:t.price,discount:t.discount,unit:t.unit})):[];return Array.isArray(t.items)?t.items:[]}function s(t){let e=t.qty*t.price;return t.discount&&t.discount>0?e*(1-t.discount/100):e}function r(t){return t.reduce((t,e)=>t+s(e),0)}function n(t){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return t.replace(/[&<>"']/g,t=>e[t])}function o(t,e="RUB"){return`${t.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})} ${({RUB:"₽",USD:"$",EUR:"€"})[e]||e}`}function c(t){return t.toLocaleString("ru-RU",{minimumFractionDigits:2,maximumFractionDigits:2})}function d(t){let d,{proposal:l,workspace:p,client:m}=t,g=a(l),u=i(l),v=l.productsView?.showUnitColumn!==!1,h=l.productsView?.showDiscountColumn!==!1,f=5+ +!!v+ +!!h,x=function(t="RUB"){return({RUB:"₽",USD:"$",EUR:"€"})[t]||t}(l.currency),$=Array.isArray(u?.rows)?u.rows:[],y=$.length>0,b=y||g.length>0,w=r(g),C=l.includeVat&&0!==l.vatRate?r(a(l))*(l.vatRate/100):0,E=function(t){let e=r(a(t));return t.includeVat&&t.vatRate>0?e*(1+t.vatRate/100):e}(l),z=Array.isArray(l.advantages)?l.advantages:[],A="number"==typeof l.advantagesColumns?Math.min(3,Math.max(1,l.advantagesColumns)):3,U=z.length>=3?3:A,D=Array.isArray(l.visibleSections)?l.visibleSections:null,P=t=>!D||D.includes(t);return`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${n(l.title)}</title>
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
      ${p?.logoUrl?`<img src="${n(p.logoUrl)}" alt="Logo" class="logo">`:""}
    </div>
    <div class="company-info">
      ${p?.companyName?`<div><strong>${n(p.companyName)}</strong></div>`:""}
      ${p?.inn?`<div>ИНН: ${n(p.inn)}</div>`:""}
    </div>
  </div>

  <!-- Заголовок -->
  ${P("basic")&&l.title?`<h1>${n(l.title)}</h1>`:""}

  <!-- Обращение -->
  ${P("basic")&&l.recipientName?`<div class="greeting">${n(l.recipientName)}</div>`:""}

  <!-- Описание проблемы (Point A) -->
  ${P("context")&&l.problemDesc?`
    <div class="section">
      <div class="section-content">${n(l.problemDesc)}</div>
    </div>
  `:""}

  <!-- Предлагаемое решение (Point B) -->
  ${P("context")&&l.solutionDesc?`
    <div class="section">
      <div class="section-content">${n(l.solutionDesc)}</div>
    </div>
  `:""}

  <!-- Дополнительное описание -->
  ${P("context")&&l.additionalDesc?`
    <div class="section">
      <div class="section-content">${n(l.additionalDesc)}</div>
    </div>
  `:""}

  <!-- Преимущества -->
  ${P("advantages")&&z.length>0?`
    <div class="section">
      <div class="section-title">Преимущества</div>
      <div class="advantages-grid" style="--advantages-columns: ${U}">
        ${z.map(t=>`
          <div class="advantage-card">
            <div class="advantage-icon">
              ${t.iconUrl?`<img src="${n(t.iconUrl)}" alt="Иконка преимущества">`:"★"}
            </div>
            <div class="advantage-title">${n(t.title||"Без названия")}</div>
            <div class="advantage-description">${n(t.description||"")}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `:""}

  <!-- Таблица товаров/услуг -->
  ${P("products")&&b?`
    ${u?`
      <div class="variant-meta">
        <div class="variant-name">
          ${n(u.name)}
          ${u.isRecommended?'<span class="variant-badge">Рекомендуем</span>':""}
        </div>
        ${u.description?`<div class="variant-description">${n(u.description)}</div>`:""}
      </div>
    `:""}
    <table class="price-table">
      <thead>
        <tr>
          <th>№</th>
          <th>Наименование</th>
          <th class="text-center">Кол-во</th>
          ${v?'<th class="text-center">Ед.</th>':""}
          <th class="text-right">Цена, ${x}</th>
          ${h?'<th class="text-right">Скидка</th>':""}
          <th class="text-right">Сумма, ${x}</th>
        </tr>
      </thead>
      <tbody>
        ${y?(d=0,$.map(t=>e(t)?(d+=1,`
                <tr>
                  <td class="text-center">${d}</td>
                  <td>
                    <strong>${n(t.name)}</strong>
                    ${t.description?`<br><small style="color: #666;">${n(t.description)}</small>`:""}
                  </td>
                  <td class="text-center">${t.qty}</td>
                  ${v?`<td class="text-center">${n(t.unit||"шт")}</td>`:""}
                  <td class="text-right">${c(t.price)}</td>
                  ${h?`<td class="text-right">${t.discount?`${t.discount}%`:"0%"}</td>`:""}
                  <td class="text-right"><strong>${c(s(t))}</strong></td>
                </tr>
              `):`
                  <tr class="group-row">
                    <td colspan="${f}">${n(t.title||"Группа")}</td>
                  </tr>
                `).join("")):g.map((t,e)=>`
          <tr>
            <td class="text-center">${e+1}</td>
            <td>
              <strong>${n(t.name)}</strong>
              ${t.description?`<br><small style="color: #666;">${n(t.description)}</small>`:""}
            </td>
            <td class="text-center">${t.qty}</td>
            ${v?`<td class="text-center">${n(t.unit||"шт")}</td>`:""}
            <td class="text-right">${c(t.price)}</td>
            ${h?`<td class="text-right">${t.discount?`${t.discount}%`:"0%"}</td>`:""}
            <td class="text-right"><strong>${c(s(t))}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <!-- Итоги -->
    <div class="totals">
      <div class="totals-row">
        <span class="totals-label">Итого:</span>
        <span class="totals-value">${o(w,l.currency)}</span>
      </div>
      ${l.includeVat?`
        <div class="totals-row">
          <span class="totals-label">НДС ${l.vatRate}%:</span>
          <span class="totals-value">${o(C,l.currency)}</span>
        </div>
        <div class="totals-row total">
          <span class="totals-label">Всего с НДС:</span>
          <span class="totals-value">${o(E,l.currency)}</span>
        </div>
      `:`
        <div class="totals-row total">
          <span class="totals-label">Всего:</span>
          <span class="totals-value">${o(E,l.currency)}</span>
        </div>
      `}
    </div>
  `:""}

  <!-- Условия -->
  ${P("terms")&&(l.deadline||l.paymentTerms||l.validUntil)?`
    <div class="terms">
      ${l.deadline?`
        <div class="term-item">
          <div class="term-label">Срок выполнения:</div>
          <div class="term-value">${n(l.deadline)}</div>
        </div>
      `:""}
      ${l.paymentTerms?`
        <div class="term-item">
          <div class="term-label">Условия оплаты:</div>
          <div class="term-value">${"prepaid"===l.paymentTerms?"100% предоплата":"50-50"===l.paymentTerms?"50% предоплата / 50% по завершении":"postpaid"===l.paymentTerms?"Постоплата":l.paymentCustom?n(l.paymentCustom):n(l.paymentTerms)}</div>
        </div>
      `:""}
      ${l.validUntil?`
        <div class="term-item">
          <div class="term-label">Срок действия предложения:</div>
          <div class="term-value">${new Date(l.validUntil).toLocaleDateString("ru-RU")}</div>
        </div>
      `:""}
    </div>
  `:""}

  <!-- Галерея -->
  ${P("gallery")&&l.galleryImages&&l.galleryImages.length>0?`
    <div class="section">
      <div class="section-title">Примеры работ</div>
      <div class="gallery">
        ${l.galleryImages.map(t=>`<img src="${n(t)}" alt="Portfolio image">`).join("")}
      </div>
    </div>
  `:""}

  <!-- CTA -->
  ${P("contacts")&&(l.ctaText||l.ctaPhone||l.ctaEmail)?`
    <div class="cta">
      ${l.ctaText?`<div class="cta-text">${n(l.ctaText)}</div>`:""}
      <div class="cta-contacts">
        ${l.ctaPhone?`📞 ${n(l.ctaPhone)}`:""}
        ${l.ctaPhone&&l.ctaEmail?" • ":""}
        ${l.ctaEmail?`✉️ ${n(l.ctaEmail)}`:""}
      </div>
    </div>
  `:""}

  <!-- Примечания -->
  ${P("terms")&&l.notes?`
    <div class="section">
      <div class="section-title">Примечания</div>
      <div class="section-content">${n(l.notes)}</div>
    </div>
  `:""}

  <!-- Футер с реквизитами -->
  ${p?`
    <div class="footer">
      <div class="requisites">
        <div><strong>Реквизиты:</strong></div>
        <div class="requisites-grid">
          ${p.companyName?`<div>Наименование: ${n(p.companyName)}</div>`:""}
          ${p.inn?`<div>ИНН: ${n(p.inn)}</div>`:""}
          ${p.ogrn?`<div>ОГРН: ${n(p.ogrn)}</div>`:""}
          ${p.legalAddress?`<div style="grid-column: 1 / -1;">Юр. адрес: ${n(p.legalAddress)}</div>`:""}
          ${p.bankName?`<div>Банк: ${n(p.bankName)}</div>`:""}
          ${p.bik?`<div>БИК: ${n(p.bik)}</div>`:""}
          ${p.accountNumber?`<div style="grid-column: 1 / -1;">Р/С: ${n(p.accountNumber)}</div>`:""}
        </div>
      </div>
      
      ${p.signatureUrl||p.stampUrl?`
        <div class="signatures">
          ${p.signatureUrl?`
            <div class="signature-item">
              <img src="${n(p.signatureUrl)}" alt="Подпись">
            </div>
          `:""}
          ${p.stampUrl?`
            <div class="signature-item">
              <img src="${n(p.stampUrl)}" alt="Печать">
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
</html>`}t.s(["renderProposalToHtml",()=>d],55210),t.s(["launchPdfBrowser",()=>f],4531);var l=t.i(60526),p=t.i(50227),m=t.i(12714),g=t.i(2157);async function u(t){try{return await (0,m.access)(t,g.constants.X_OK),!0}catch{return!1}}async function v(){if(process.env.CHROME_EXECUTABLE_PATH?.trim()){let t=process.env.CHROME_EXECUTABLE_PATH.trim();if(await u(t))return t;console.warn("[pdf] Указанный CHROME_EXECUTABLE_PATH недоступен:",t)}l.default.platform();let t=[];for(let e of(t.push("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),t.push("/Applications/Chromium.app/Contents/MacOS/Chromium"),t.push("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),process.env.HOME&&t.push(p.default.join(process.env.HOME,"Applications/Google Chrome.app/Contents/MacOS/Google Chrome")),t))try{if(e&&await u(e))return e}catch{}return null}async function h(e){let i=(await t.A(53206)).default,a=await i.executablePath();return e.launch({args:i.args,defaultViewport:{width:1280,height:720},executablePath:a??void 0,headless:!0})}async function f(){let e=(await t.A(89728)).default;if("linux"===process.platform||process.env.AWS_REGION||process.env.AWS_EXECUTION_ENV||process.env.VERCEL||process.env.NETLIFY||process.env.CHROME_BINARY_PATH)return h(e);let i=await v();if(i)try{return await e.launch({executablePath:i,headless:!0,args:["--no-sandbox","--disable-gpu"]})}catch(t){console.warn("[pdf] Не удалось запустить локальный Chrome, используем @sparticuz/chromium.",t)}else console.warn("[pdf] Локальный Chrome не найден, переключаемся на @sparticuz/chromium.");return h(e)}t.s(["generateCacheKey",()=>w,"getCachedPdf",()=>U,"setCachedPdf",()=>D],83903);var x=t.i(54799),$=t.i(22734),y=t.i(14747);let b=(0,y.join)(process.cwd(),".cache","pdf");function w(t,e){let i=(0,x.createHash)("sha256");return i.update(`${t}:${e}`),i.digest("hex")}async function C(){try{await $.promises.mkdir(b,{recursive:!0})}catch(t){console.error("Failed to create cache directory:",t)}}function E(t){return(0,y.join)(b,`${t}.pdf`)}async function z(t){try{let e=E(t),i=await $.promises.stat(e),a=Date.now()-i.mtimeMs;return{exists:!0,size:i.size,age:a}}catch{return null}}async function A(t){let e=await z(t);return!!e&&!!e.exists&&(!(e.age>864e5)||(await P(t),!1))}async function U(t){try{if(!await A(t))return null;let e=E(t),i=await $.promises.readFile(e);return console.log(`[PDF Cache] HIT: ${t}`),i}catch(t){return console.error("[PDF Cache] Error reading cache:",t),null}}async function D(t,e){try{await C();let i=E(t);await $.promises.writeFile(i,e),console.log(`[PDF Cache] SET: ${t} (${(e.length/1024).toFixed(2)} KB)`),R().catch(t=>console.error("[PDF Cache] Cleanup error:",t))}catch(t){console.error("[PDF Cache] Error writing cache:",t)}}async function P(t){try{let e=E(t);await $.promises.unlink(e),console.log(`[PDF Cache] DELETE: ${t}`)}catch(t){}}async function R(){try{await C();let t=await $.promises.readdir(b),e=0,i=[];for(let a of t)if(a.endsWith(".pdf"))try{let t=(0,y.join)(b,a),s=await $.promises.stat(t);if(Date.now()-s.mtimeMs>864e5){await $.promises.unlink(t),console.log(`[PDF Cache] Removed expired: ${a}`);continue}i.push({file:a,mtime:s.mtimeMs,size:s.size}),e+=s.size}catch{}if(e>524288e3)for(let t of(i.sort((t,e)=>t.mtime-e.mtime),i)){if(e<=524288e3)break;try{await $.promises.unlink((0,y.join)(b,t.file)),e-=t.size,console.log(`[PDF Cache] Removed to free space: ${t.file}`)}catch{}}console.log(`[PDF Cache] Cleanup complete. Total size: ${(e/1024/1024).toFixed(2)} MB`)}catch(t){console.error("[PDF Cache] Cleanup failed:",t)}}}];

//# sourceMappingURL=%5Broot-of-the-server%5D__f2c019e1._.js.map