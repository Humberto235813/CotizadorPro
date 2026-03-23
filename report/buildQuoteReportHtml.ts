/**
 * Unified quote HTML report generator — Manual pagination edition.
 *
 * Two public APIs:
 *   1. buildQuoteReportHtml(quote, company)  — accepts full Quote + Company objects (used by Dashboard)
 *   2. buildQuoteHtml(data)                  — accepts a flat QuoteRenderData object (used by QuoteGenerator)
 *
 * Produces a paginated preview using pure CSS + JS:
 *  - Single continuous document, styled as a centered card
 *  - JavaScript calculates page positions and injects visual separators with page numbers
 *  - ✂ controls between table rows allow user to force page breaks (persisted in sessionStorage)
 *  - Correct "Página X de Y" via CSS @page counter (native Chrome/Edge)
 *  - Floating toolbar with "Imprimir / PDF" button
 */

import { Quote, Company } from '../types';

// ---------------------------------------------------------------------------
// Shared types & helpers
// ---------------------------------------------------------------------------

export interface QuoteRenderData {
  company: { name: string; rfc?: string; address: string; phone: string; logo?: string; primaryColor?: string; website?: string; bankDetails?: string; };
  quote: { number: string; date: string; subtotal: number; tax: number; total: number; vigenciaDias: number; status?: string; };
  client: { name?: string; company?: string; address?: string; email?: string; phone?: string; };
  items: Array<{
    description: string;
    quantity: number;
    price: number;
    discountType?: 'percent' | 'amount';
    discountValue?: number;
    displayStyle?: 'normal' | 'highlight' | 'small';
  }>;
  notes?: string;
  conditions?: string;
  bank?: string;
}

const HTML_ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (v: unknown): string => v == null ? '' : String(v).replace(/[&<>"']/g, c => HTML_ENTITIES[c] || c);
const fmtMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);

// ---------------------------------------------------------------------------
// Core renderer
// ---------------------------------------------------------------------------

function renderHtml(d: QuoteRenderData): string {
  const brand = d.company.primaryColor || '#364FC7';
  const logo = d.company.logo || '';

  const bankLines = d.bank
    ? d.bank.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    : d.company.bankDetails
      ? d.company.bankDetails.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      : [];

  const formatDescription = (raw: string): string => {
    if (!raw) return '';
    const safe = esc(raw);
    return safe.split(/\r?\n/).map(l => {
      const t = l.trim(); if (!t) return '';
      const isBullet = /^[-*]\s+/.test(t);
      let c = t.replace(/^[-*]\s+/, '');
      c = c.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|$)/g, '$1<em>$2</em>');
      if (isBullet) return `<div class="line bullet"><span class="dot">•</span><span>${c}</span></div>`;
      return `<div class="line">${c}</div>`;
    }).filter(Boolean).join('');
  };

  const statusMap: Record<string, string> = { sold: 'VENDIDA', draft: 'BORRADOR', created: 'ENVIADA' };
  const statusLabel = d.quote.status ? (statusMap[d.quote.status] || 'ENVIADA') : '';

  const anyDiscount = d.items.some(it => it.discountType && it.discountValue);
  const colSpan = anyDiscount ? 5 : 4;

  // Panels
  const issuerParts: string[] = [];
  if (d.company.name) issuerParts.push(`<div class="kv"><strong>Nombre:</strong> ${esc(d.company.name)}</div>`);
  if (d.company.rfc) issuerParts.push(`<div class="kv"><strong>RFC:</strong> ${esc(d.company.rfc)}</div>`);
  if (d.company.address) issuerParts.push(`<div class="kv"><strong>Dirección:</strong> ${esc(d.company.address)}</div>`);
  if (d.company.phone) issuerParts.push(`<div class="kv"><strong>Teléfono:</strong> ${esc(d.company.phone)}</div>`);
  const issuerPanel = issuerParts.length ? `<div class="panel"><h2>Emisor</h2>${issuerParts.join('')}</div>` : '';

  const clientParts: string[] = [];
  if (d.client.name) clientParts.push(`<div class="kv"><strong>Nombre:</strong> ${esc(d.client.name)}</div>`);
  if (d.client.company) clientParts.push(`<div class="kv"><strong>Empresa:</strong> ${esc(d.client.company)}</div>`);
  if (d.client.address) clientParts.push(`<div class="kv"><strong>Dirección:</strong> ${esc(d.client.address)}</div>`);
  if (d.client.email) clientParts.push(`<div class="kv"><strong>Email:</strong> ${esc(d.client.email)}</div>`);
  if (d.client.phone) clientParts.push(`<div class="kv"><strong>Teléfono:</strong> ${esc(d.client.phone)}</div>`);
  const clientPanel = clientParts.length
    ? `<div class="panel"><h2>Datos del Cliente</h2>${clientParts.join('')}</div>`
    : `<div class="panel"><h2>Datos del Cliente</h2><div class="kv" style="font-style:italic;color:#718096;">Sin datos de cliente.</div></div>`;

  const notesBlock = d.notes ? `<div class="notes"><strong>Notas:</strong> ${esc(d.notes)}</div>` : '';
  const condBlock = d.conditions ? `<div class="notes" style="margin-top:6px;"><strong>Condiciones:</strong> ${esc(d.conditions)}</div>` : '';
  const bankBlock = bankLines.length ? `<div class="notes" style="margin-top:10px;"><strong>Datos Bancarios:</strong><br>${bankLines.map(l => esc(l)).join('<br>')}</div>` : '';
  const vigencia = d.quote.vigenciaDias ? `<div class="notes" style="margin-top:6px;font-size:10px;color:#718096;">Esta cotización es válida por ${d.quote.vigenciaDias} días. Precios en MXN.</div>` : '';

  // Item rows  
  const itemsRows = d.items.map((it, idx) => {
    const base = it.quantity * it.price;
    let discount = 0;
    if (it.discountType === 'percent') discount = base * ((it.discountValue || 0) / 100);
    else if (it.discountType === 'amount') discount = it.discountValue || 0;
    const lineTotal = Math.max(0, base - discount);
    let discountLabel = '';
    if (it.discountType === 'percent') discountLabel = `${it.discountValue || 0}%`;
    else if (it.discountType === 'amount') discountLabel = `$${(it.discountValue || 0).toFixed(2)}`;
    const descHtml = formatDescription(it.description || '');
    let styleClass = '';
    if (it.displayStyle === 'highlight') styleClass = 'desc-highlight';
    else if (it.displayStyle === 'small') styleClass = 'desc-small';

    return `<tr class="data-row" data-idx="${idx}">
      <td class="desc-col ${styleClass}">${descHtml}</td>
      <td class="text-right nowrap">${it.quantity}</td>
      <td class="text-right nowrap">${fmtMoney(it.price)}</td>
      ${anyDiscount ? `<td class="text-right nowrap">${discount ? esc(discountLabel) : ''}</td>` : ''}
      <td class="text-right nowrap font-medium">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const breaksKey = 'pb_' + d.quote.number.replace(/[^a-z0-9]/gi, '_');

  // Page dimensions (Letter)
  const pageW = 816; // 8.5in at 96dpi
  const pageH = 1056; // 11in at 96dpi
  const marginX = 50; // ~13mm
  const marginTop = 54; // ~14mm
  const marginBottom = 84; // ~22mm for footer
  const contentH = pageH - marginTop - marginBottom; // usable height per page

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
  <title>Cotización ${esc(d.quote.number)} — ${esc(d.company.name)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>
    :root { --brand: ${brand}; --page-w: ${pageW}px; --page-h: ${pageH}px; --content-h: ${contentH}px; --mx: ${marginX}px; --mt: ${marginTop}px; --mb: ${marginBottom}px; }
    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* ===== PRINT ===== */
    @page { size: Letter; margin: 12mm 13mm 18mm 13mm; }
    @media print {
      html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
      #toolbar, .page-sep, .pb-ctrl-row { display: none !important; }

      .sheet {
        box-shadow: none !important; margin: 0 !important;
        padding: 0 !important; width: 100% !important;
        min-height: 0 !important; border-radius: 0 !important;
        overflow: visible !important;
      }
      .inner { padding: 0 !important; overflow: visible !important; }

      thead { display: table-header-group; }
      tr.data-row { break-inside: avoid; page-break-inside: avoid; }
      .info-grid, header, .totals, .notes { break-inside: avoid; page-break-inside: avoid; }
      .totals { break-before: avoid; page-break-before: avoid; }

      h1 { font-size: 14pt !important; }
      .brand-name { font-size: 12pt !important; }
      .meta { font-size: 8pt !important; }
      header { margin-bottom: 10pt !important; gap: 12px !important; }
      header .logo { width: 60pt !important; height: 60pt !important; }
      .info-grid { gap: 10pt !important; margin-bottom: 10pt !important; }
      .panel { padding: 6pt 8pt !important; }
      .panel h2 { font-size: 7.5pt !important; margin-bottom: 3pt !important; }
      .kv { font-size: 8pt !important; }
      th { font-size: 8pt !important; padding: 4pt 5pt !important; }
      td { font-size: 8.5pt !important; padding: 4pt 5pt !important; }
      .line { line-height: 1.25 !important; margin-bottom: 1pt !important; }
      .totals td { padding: 2pt 0 !important; }
      .notes { font-size: 8pt !important; margin-top: 8pt !important; }

      /* Custom company footer — repeats on every printed page */
      .print-footer {
        display: block !important;
        position: fixed; bottom: 0; left: 0; right: 0;
        text-align: center;
        font-size: 7pt; color: #64748b;
        font-family: ui-sans-serif, system-ui, sans-serif;
        padding: 4pt 0 0;
        border-top: 0.5pt solid #cbd5e1;
      }
    }
    /* Hidden on screen */
    .print-footer { display: none; }

    /* ===== SCREEN ===== */
    html, body {
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt; color: #1e293b;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
      background: #dde1ee;
    }
    body { display: flex; flex-direction: column; align-items: center; padding: 56px 24px 48px; min-height: 100vh; }

    /* ===== SHEET (single card, paginated visually) ===== */
    .sheet {
      width: var(--page-w); background: #fff;
      box-shadow: 0 4px 24px -4px rgba(0,0,0,0.2);
      border-radius: 4px; position: relative;
    }
    .inner { padding: var(--mt) var(--mx) var(--mb); }

    /* ===== PAGE SEPARATOR (injected by JS at page boundaries) ===== */
    .page-sep {
      width: 100%; position: relative;
      margin: 0; padding: 0;
      border: none;
    }
    .page-sep-inner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px var(--mx); font-size: 8pt; color: #64748b;
      font-family: ui-sans-serif, system-ui, sans-serif;
      border-top: 0.5px solid #cbd5e1; border-bottom: 0.5px solid #cbd5e1;
      background: #f1f5f9; margin: 16px 0;
    }
    .page-sep .ps-left { flex: 1; }
    .page-sep .ps-right { color: var(--brand); font-weight: 600; }

    /* ===== TOOLBAR ===== */
    #toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
      background: var(--brand);
      display: flex; align-items: center; justify-content: space-between;
      padding: 9px 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    .tb-left { display: flex; flex-direction: column; gap: 1px; }
    .tb-title { color: #fff; font-size: 13px; font-weight: 700; }
    .tb-hint { color: rgba(255,255,255,0.7); font-size: 10px; }
    .tb-right { display: flex; align-items: center; gap: 12px; }
    .tb-pages { color: rgba(255,255,255,0.85); font-size: 12px; }
    #tb-print {
      background: #fff; color: var(--brand); border: none;
      padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15); transition: transform 0.1s;
    }
    #tb-print:hover { transform: scale(1.03); }

    /* ===== HEADER ===== */
    header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 14pt; }
    header .logo { width: 72pt; height: 72pt; object-fit: contain; border-radius: 6pt; background: #f8fafc; flex-shrink: 0; }
    h1 { font-size: 16pt; font-weight: 700; letter-spacing: 0.3pt; color: #111827; }
    .brand-name { font-size: 14pt; color: var(--brand); font-weight: 700; }
    .meta { font-size: 9pt; color: #64748b; line-height: 1.5; margin-top: 3pt; }
    .badge { display: inline-block; padding: 3pt 8pt; border-radius: 99pt; background: var(--brand); color: #fff; font-size: 8pt; font-weight: 700; letter-spacing: 0.4pt; }

    /* ===== PANELS ===== */
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt; margin: 0 0 14pt; }
    .panel { border: 0.75pt solid #e2e8f0; border-radius: 6pt; padding: 8pt 10pt; background: #f8fafc; }
    .panel h2 { margin: 0 0 5pt; font-size: 8.5pt; letter-spacing: 0.4pt; text-transform: uppercase; color: #374151; }
    .kv { font-size: 9pt; line-height: 1.4; margin: 1.5pt 0; color: #374151; }
    .kv strong { color: #111827; font-weight: 600; }

    /* ===== TABLE ===== */
    table { border-collapse: collapse; width: 100%; table-layout: auto; }
    thead { display: table-header-group; }
    th { text-align: left; background: #f1f5f9; font-weight: 600; font-size: 9pt; letter-spacing: 0.4pt; color: #374151; padding: 5pt 7pt; white-space: nowrap; }
    th.desc-col { width: 100%; white-space: normal; }
    td { border-top: 0.5pt solid #e2e8f0; font-size: 9.5pt; padding: 6pt 7pt; vertical-align: top; }
    td.desc-col { width: 100%; }
    .nowrap { white-space: nowrap; width: 1%; }
    tbody tr:last-child td { border-bottom: 0.5pt solid #e2e8f0; }

    /* ===== TOTALS ===== */
    .totals { margin-top: 18pt; width: 100%; font-size: 10pt; }
    .totals td { border: none; padding: 3pt 0; }
    .totals tr.total-row td { font-size: 12pt; font-weight: 700; color: var(--brand); border-top: 0.75pt solid #e2e8f0; padding-top: 5pt; }

    /* ===== NOTES ===== */
    .notes { margin-top: 10pt; font-size: 9pt; line-height: 1.5; color: #374151; white-space: pre-wrap; }

    /* ===== HELPERS ===== */
    .desc-highlight { background: #fffceb; }
    .desc-small { font-size: 8pt; line-height: 1.25; }
    .line { line-height: 1.3; margin-bottom: 1.5pt; }
    .line.bullet { display: flex; gap: 4pt; }
    .line .dot { width: 9pt; text-align: center; flex-shrink: 0; }
    .text-right { text-align: right; }
    .font-medium { font-weight: 600; }

    /* ===== PAGE BREAK CONTROLS ===== */
    .pb-btn-wrap {
      display: flex; align-items: center; gap: 8px;
      cursor: pointer; opacity: 0; transition: opacity 0.2s;
      padding: 2px 0; margin: -1px 0;
    }
    tr.data-row:hover + tr .pb-btn-wrap,
    .pb-btn-wrap:hover,
    .pb-btn-wrap.active { opacity: 1; }
    .pb-btn-wrap .pb-line { flex: 1; height: 1px; background: #94a3b8; }
    .pb-btn-wrap.active .pb-line { background: var(--brand); }
    .pb-btn {
      background: #fff; border: 1.5px dashed #94a3b8; border-radius: 6px;
      padding: 1px 8px; font-size: 8pt; color: #64748b; cursor: pointer;
      font-family: inherit; white-space: nowrap; transition: all 0.15s;
    }
    .pb-btn-wrap.active .pb-btn { background: #eff6ff; border-color: var(--brand); border-style: solid; color: var(--brand); font-weight: 600; }
    .pb-btn-wrap:hover .pb-btn { border-color: var(--brand); color: var(--brand); }

    .pb-ctrl-row td { padding: 0 !important; border: none !important; }
    @media print { .pb-ctrl-row { display: none !important; } }

    /* Force break in print */
    .force-break { break-before: page; page-break-before: always; }
  </style>
  </head><body>

  <!-- Toolbar -->
  <div id="toolbar">
    <div class="tb-left">
      <div class="tb-title">Vista Previa · Cotización ${esc(d.quote.number)}</div>
      <div class="tb-hint">Pasa el cursor entre conceptos para controlar saltos de página</div>
    </div>
    <div class="tb-right">
      <span class="tb-pages" id="tb-pages"></span>
      <button id="tb-print" onclick="window.print()">📄 Imprimir / PDF</button>
    </div>
  </div>

  <!-- Document -->
  <div class="sheet" id="sheet">
    <div class="inner" id="inner">
      <header>
        ${logo ? `<img src="${logo}" class="logo" alt="Logo" />` : ''}
        <div style="flex:1;min-width:0;">
          <h1>Cotización ${esc(d.quote.number)}</h1>
          ${d.company.name ? `<div class="brand-name">${esc(d.company.name)}</div>` : ''}
          <div class="meta">
            <div><strong>Fecha:</strong> ${esc(d.quote.date)}</div>
            ${d.client.company ? `<div><strong>Cliente:</strong> ${esc(d.client.company)}</div>` : ''}
          </div>
        </div>
        ${statusLabel ? `<div><span class="badge">${statusLabel}</span></div>` : ''}
      </header>

      <div class="info-grid">
        ${clientPanel}
        ${issuerPanel}
      </div>

      <section>
        <table id="items-table">
          <thead><tr>
            <th class="desc-col">Descripción</th>
            <th class="nowrap">Cant.</th>
            <th class="nowrap">Precio</th>
            ${anyDiscount ? '<th class="nowrap">Desc.</th>' : ''}
            <th class="nowrap">Importe</th>
          </tr></thead>
          <tbody id="items-body">${itemsRows || `<tr><td colspan="${colSpan}" style="text-align:center;padding:12pt;color:#94a3b8;font-style:italic;">Sin conceptos</td></tr>`}</tbody>
        </table>

        <table class="totals"><tbody>
          <tr><td style="text-align:right;width:80%;padding-right:8pt;">Subtotal</td><td style="text-align:right;width:20%;">${fmtMoney(d.quote.subtotal)}</td></tr>
          <tr><td style="text-align:right;padding-right:8pt;">Impuesto</td><td style="text-align:right;">${fmtMoney(d.quote.tax)}</td></tr>
          <tr class="total-row"><td style="text-align:right;padding-right:8pt;">TOTAL</td><td style="text-align:right;">${fmtMoney(d.quote.total)}</td></tr>
        </tbody></table>

        ${bankBlock}
        ${notesBlock}
        ${condBlock}
        ${vigencia}
      </section>
    </div>
  </div>

  <!-- Company footer — only visible when printing -->
  <div class="print-footer">
    ${esc(d.company.name)}${d.company.phone ? '  &middot;  Tel: ' + esc(d.company.phone) : ''}${d.company.address ? '  &middot;  ' + esc(d.company.address) : ''}${d.company.website ? '  &middot;  ' + esc(d.company.website) : ''}
  </div>

  <script>
  (function() {
    var BREAKS_KEY = '${breaksKey}';
    var COLS = ${colSpan};
    var PAGE_H = ${contentH};
    var FOOTER_TEXT = '${esc(d.company.name)}${d.company.website ? '  ·  ' + esc(d.company.website) : ''}';

    // 1. Restore forced breaks
    var savedBreaks = [];
    try { savedBreaks = JSON.parse(sessionStorage.getItem(BREAKS_KEY) || '[]'); } catch(e) {}
    savedBreaks.forEach(function(idx) {
      var row = document.querySelector('tr.data-row[data-idx="' + idx + '"]');
      if (row) row.classList.add('force-break');
    });

    // 2. Insert ✂ control rows between data rows
    var dataRows = document.querySelectorAll('#items-body tr.data-row');
    for (var i = 1; i < dataRows.length; i++) {
      var row = dataRows[i];
      var idx = parseInt(row.getAttribute('data-idx'));
      var ctrlRow = document.createElement('tr');
      ctrlRow.className = 'pb-ctrl-row';
      var td = document.createElement('td');
      td.setAttribute('colspan', COLS);
      var wrap = document.createElement('div');
      wrap.className = 'pb-btn-wrap' + (savedBreaks.indexOf(idx) >= 0 ? ' active' : '');
      wrap.innerHTML = '<div class="pb-line"></div><button class="pb-btn">✂ Salto de página</button><div class="pb-line"></div>';
      wrap.addEventListener('click', (function(theIdx) {
        return function() {
          var breaks = [];
          try { breaks = JSON.parse(sessionStorage.getItem(BREAKS_KEY) || '[]'); } catch(e) {}
          var pos = breaks.indexOf(theIdx);
          if (pos >= 0) breaks.splice(pos, 1); else breaks.push(theIdx);
          sessionStorage.setItem(BREAKS_KEY, JSON.stringify(breaks));
          location.reload();
        };
      })(idx));
      td.appendChild(wrap);
      ctrlRow.appendChild(td);
      row.parentNode.insertBefore(ctrlRow, row);
    }

    // 3. Calculate page breaks and inject visual separators
    function calculatePages() {
      var inner = document.getElementById('inner');
      var sheet = document.getElementById('sheet');
      if (!inner || !sheet) return;

      // Remove old separators
      var oldSeps = sheet.querySelectorAll('.page-sep');
      oldSeps.forEach(function(s) { s.remove(); });

      var innerTop = inner.getBoundingClientRect().top;
      var totalH = inner.scrollHeight;
      var totalPages = Math.max(1, Math.ceil(totalH / PAGE_H));

      // Insert page separators at each page boundary
      for (var p = 1; p < totalPages; p++) {
        var breakY = p * PAGE_H;
        var sep = document.createElement('div');
        sep.className = 'page-sep';
        sep.innerHTML = '<div class="page-sep-inner">'
          + '<span class="ps-left">' + FOOTER_TEXT + '</span>'
          + '<span class="ps-right">Página ' + p + ' de ' + totalPages + '</span>'
          + '</div>';
        sep.style.position = 'relative';

        // Find the element at this Y position and insert before it
        var children = inner.children;
        var inserted = false;
        for (var c = 0; c < children.length; c++) {
          var child = children[c];
          var childTop = child.getBoundingClientRect().top - innerTop;
          if (childTop >= breakY - 10) {
            inner.insertBefore(sep, child);
            inserted = true;
            break;
          }
        }
        if (!inserted) inner.appendChild(sep);
      }

      // Also add final "page N of N" at the very bottom
      var lastSep = document.createElement('div');
      lastSep.className = 'page-sep';
      lastSep.innerHTML = '<div class="page-sep-inner">'
        + '<span class="ps-left">' + FOOTER_TEXT + '</span>'
        + '<span class="ps-right">Página ' + totalPages + ' de ' + totalPages + '</span>'
        + '</div>';
      inner.appendChild(lastSep);

      // Update toolbar page count
      var tbPages = document.getElementById('tb-pages');
      if (tbPages) tbPages.textContent = totalPages + (totalPages === 1 ? ' página' : ' páginas');
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', calculatePages);
    } else {
      setTimeout(calculatePages, 50);
    }
  })();
  </script>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Public API 1: Full Quote + Company objects (Dashboard)
// ---------------------------------------------------------------------------

export function buildQuoteReportHtml(quote: Quote, company?: Company): string {
  const data: QuoteRenderData = {
    company: {
      name: company?.name || '',
      rfc: company?.rfc || '',
      address: company?.address || '',
      phone: company?.phone || '',
      logo: company?.logo,
      primaryColor: company?.primaryColor,
      website: company?.website,
      bankDetails: company?.bankDetails,
    },
    quote: {
      number: quote.quoteNumber,
      date: new Date(quote.date).toLocaleDateString(),
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      vigenciaDias: quote.vigenciaDias || 30,
      status: quote.status,
    },
    client: {
      name: quote.clientName,
      company: quote.clientCompany,
      address: quote.clientAddress,
      email: quote.clientEmail,
      phone: quote.clientPhone,
    },
    items: quote.items.map(it => ({
      description: it.description || '',
      quantity: it.quantity || 0,
      price: it.price || 0,
      discountType: it.discountType,
      discountValue: it.discountValue,
      displayStyle: it.displayStyle,
    })),
    notes: quote.notes,
    conditions: quote.serviceConditions,
    bank: company?.bankDetails,
  };

  return renderHtml(data);
}

// ---------------------------------------------------------------------------
// Public API 2: Flat QuoteRenderData (QuoteGenerator)
// ---------------------------------------------------------------------------

export function buildQuoteHtml(data: QuoteRenderData): string {
  return renderHtml(data);
}

export default buildQuoteReportHtml;