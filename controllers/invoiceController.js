// controllers/invoiceController.js – Système de facturation NANA RAFF
const { Order } = require('../models');
const ExcelJS   = require('exceljs');

const TVA_RATE = 0.1925; // 19,25% Cameroun
const COMPANY  = {
  name:     'NANA RAFF',
  activity: 'E-commerce – Santé & Beauté',
  email:    'contact@nanaraff.com',
  tel:      '+237 000 000 000',
  ville:    'Douala, Cameroun',
  rccm:     'RC/DLA/2024/B/0001',
};

function fmt(n) { return new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)) + ' FCFA'; }

function statusLabel(s) {
  const m = { pending:'En attente', processing:'En cours', shipped:'Expédié', delivered:'Livré', cancelled:'Annulé' };
  return m[s] || s;
}

function payLabel(m) {
  const map = { cash:'Paiement à la livraison', orange_money:'Orange Money', mtn_momo:'MTN Mobile Money' };
  return map[m] || m || 'Non précisé';
}

function calcTotals(items = []) {
  const ttc = items.reduce((s, it) => s + ((it.price || 0) * (it.qty || 1)), 0);
  const tva  = Math.round(ttc * TVA_RATE);
  const ht   = ttc - tva;
  return { ttc, tva, ht };
}

// ─── Liste des factures (toutes commandes) ────────────────────────────────────
exports.listInvoices = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 20);
    const { status, q } = req.query;
    const where = {};
    if (status) where.status = status;

    const { rows: orders, count } = await Order.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    const invoices = orders.map(o => {
      const items = o.items || [];
      const { ttc, tva, ht } = calcTotals(items);
      return {
        id:            o.id,
        invoiceNum:    `NR-${String(o.id).padStart(6, '0')}`,
        customerName:  o.customerName  || 'Client',
        customerPhone: o.customerPhone || '',
        customerEmail: o.customerEmail || '',
        ttc, tva, ht,
        status:        o.status,
        paymentMethod: o.paymentMethod,
        createdAt:     o.createdAt,
      };
    });

    res.json({ invoices, total: count, page, pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

// ─── Facture HTML imprimable (→ PDF via window.print) ────────────────────────
exports.getInvoicePDF = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ msg: 'Commande introuvable' });

    const items      = order.items || [];
    const { ttc, tva, ht } = calcTotals(items);
    const invoiceNum = `NR-${String(order.id).padStart(6, '0')}`;
    const dateStr    = new Date(order.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    // Parse promoApplied
    let promoInfo = null;
    try {
      const pi = JSON.parse(order.paymentInfo || '{}');
      if (pi.promoApplied) promoInfo = pi.promoApplied;
    } catch(_) {}

    const rowsHTML = items.map((it, i) => `
      <tr class="${i % 2 === 0 ? 'even' : ''}">
        <td>${it.name || '-'}</td>
        <td class="center">${it.qty || 1}</td>
        <td class="right">${fmt(it.price)}</td>
        <td class="right bold">${fmt((it.price || 0) * (it.qty || 1))}</td>
      </tr>`).join('');

    const promoRow = promoInfo ? `
      <div class="promo-band">
        🎟️ Code promo <strong>${promoInfo.code}</strong> appliqué — Réduction : <strong>-${fmt(promoInfo.discount)}</strong>
      </div>` : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Facture ${invoiceNum} – NANA RAFF</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:40px}
.page{max-width:780px;margin:auto}
.no-print{display:flex;gap:10px;justify-content:flex-end;margin-bottom:24px}
.btn{padding:10px 22px;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;transition:opacity .2s}
.btn:hover{opacity:.85}
.btn-print{background:#1a3a2a;color:#fff}
.btn-close{background:#fff;color:#1a3a2a;border:2px solid #1a3a2a}
.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #1a3a2a;margin-bottom:28px}
.logo{font-size:30px;font-weight:900;color:#1a3a2a;letter-spacing:-1.5px}
.logo em{color:#27ae60;font-style:normal}
.tagline{font-size:11px;color:#666;margin-top:3px}
.badge-receipt{display:inline-block;background:#1a3a2a;color:#fff;font-size:10px;padding:3px 12px;border-radius:20px;margin-top:8px;letter-spacing:.8px;text-transform:uppercase}
.company-info{text-align:right;font-size:11.5px;color:#555;line-height:1.7}
.meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:22px}
.meta-box{background:#f7faf8;border-radius:10px;padding:15px 18px;border-left:3px solid #27ae60}
.meta-box h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:7px}
.meta-box p{font-size:14px;font-weight:700;color:#1a3a2a;line-height:1.5}
.meta-box .sub{font-size:12px;color:#555;font-weight:400}
.payment-band{display:flex;align-items:center;gap:16px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:12px 18px;margin-bottom:12px;flex-wrap:wrap}
.promo-band{background:#fef9c3;border:1.5px solid #fde047;border-radius:10px;padding:10px 18px;margin-bottom:12px;font-size:13px;color:#713f12}
.status-badge{background:#d1fae5;color:#065f46;font-size:11.5px;font-weight:700;padding:3px 12px;border-radius:20px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead tr{background:#1a3a2a}
thead th{color:#fff;padding:11px 14px;text-align:left;font-size:12px;letter-spacing:.3px}
tbody tr{border-bottom:1px solid #e5e7eb}
tbody tr.even{background:#f9fafb}
tbody td{padding:10px 14px}
.center{text-align:center}
.right{text-align:right}
.bold{font-weight:700}
.totals-wrap{display:flex;justify-content:flex-end;margin-bottom:28px}
.totals-box{width:320px}
.t-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px}
.t-row.discount{color:#d97706;font-weight:600}
.t-row.ttc{font-size:16px;font-weight:900;color:#1a3a2a;border:none;border-top:2px solid #1a3a2a;padding-top:12px;margin-top:4px}
.footer{text-align:center;padding-top:20px;border-top:1px solid #e5e7eb;color:#888;font-size:11px;line-height:2}
@media print{
  .no-print{display:none!important}
  body{padding:0}
  .page{max-width:100%}
}
</style>
</head>
<body>
<div class="page">
  <div class="no-print">
    <button class="btn btn-close" onclick="window.close()">✕ Fermer</button>
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimer / Enregistrer PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="logo">NANA <em>RAFF</em></div>
      <div class="tagline">${COMPANY.activity}</div>
      <div class="badge-receipt">Reçu / Ticket de caisse</div>
    </div>
    <div class="company-info">
      <div>${COMPANY.email}</div>
      <div>${COMPANY.tel}</div>
      <div>${COMPANY.ville}</div>
      <div>RCCM : ${COMPANY.rccm}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Numéro de facture</h4>
      <p style="font-size:20px">${invoiceNum}</p>
      <p class="sub">Émise le ${dateStr}</p>
    </div>
    <div class="meta-box">
      <h4>Client</h4>
      <p>${order.customerName || 'Client'}</p>
      ${order.customerPhone ? `<p class="sub">📞 ${order.customerPhone}</p>` : ''}
      ${order.customerEmail ? `<p class="sub">✉️ ${order.customerEmail}</p>` : ''}
      ${order.deliveryAddress ? `<p class="sub" style="margin-top:4px">📍 ${order.deliveryAddress}</p>` : ''}
    </div>
  </div>

  <div class="payment-band">
    <span><strong>Paiement :</strong> ${payLabel(order.paymentMethod)}</span>
    <span>·</span>
    <span><strong>Statut :</strong> <span class="status-badge">${statusLabel(order.status)}</span></span>
    ${order.notes ? `<span>· <strong>Note :</strong> ${order.notes}</span>` : ''}
  </div>
  ${promoRow}

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="center">Qté</th>
        <th class="right">Prix unitaire</th>
        <th class="right">Montant</th>
      </tr>
    </thead>
    <tbody>${rowsHTML}</tbody>
  </table>

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="t-row"><span>Montant HT</span><span>${fmt(ht)}</span></div>
      <div class="t-row"><span>TVA (19,25%)</span><span>${fmt(tva)}</span></div>
      ${promoInfo ? `<div class="t-row discount"><span>Réduction (${promoInfo.code})</span><span>-${fmt(promoInfo.discount)}</span></div>` : ''}
      <div class="t-row ttc"><span>TOTAL TTC</span><span>${fmt(order.total)}</span></div>
    </div>
  </div>

  <div class="footer">
    <strong>${COMPANY.name}</strong> · ${COMPANY.activity}<br/>
    ${COMPANY.ville} &nbsp;·&nbsp; ${COMPANY.email} &nbsp;·&nbsp; ${COMPANY.tel}<br/>
    RCCM : ${COMPANY.rccm}<br/>
    <strong>Merci pour votre confiance ! 💚</strong>
  </div>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { next(err); }
};

// ─── Facture Excel téléchargeable ─────────────────────────────────────────────
exports.getInvoiceExcel = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ msg: 'Commande introuvable' });

    const items      = order.items || [];
    const { ttc, tva, ht } = calcTotals(items);
    const invoiceNum = `NR-${String(order.id).padStart(6, '0')}`;

    // Promo info
    let promoInfo = null;
    try { const pi = JSON.parse(order.paymentInfo || '{}'); if (pi.promoApplied) promoInfo = pi.promoApplied; } catch(_) {}

    const wb = new ExcelJS.Workbook();
    wb.creator = COMPANY.name;
    const ws = wb.addWorksheet('Facture', { pageSetup: { paperSize: 9, orientation: 'portrait' } });

    ws.columns = [
      { width: 6 }, { width: 36 }, { width: 10 }, { width: 20 }, { width: 20 },
    ];

    const G = '1A3A2A', GL = 'E8F5EE', W = 'FFFFFF';

    const s = (cell, opts = {}) => {
      if (opts.bg)    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + opts.bg } };
      if (opts.bold)  cell.font = { ...(cell.font||{}), bold: true };
      if (opts.color) cell.font = { ...(cell.font||{}), color: { argb: 'FF' + opts.color } };
      if (opts.size)  cell.font = { ...(cell.font||{}), size: opts.size };
      if (opts.align) cell.alignment = { horizontal: opts.align, vertical: 'middle' };
      if (opts.num)   cell.numFmt = '#,##0';
      if (opts.italic) cell.font = { ...(cell.font||{}), italic: true };
    };

    // Titre
    ws.mergeCells('A1:E1');
    const t1 = ws.getCell('A1');
    t1.value = `${COMPANY.name}  –  Facture ${invoiceNum}`;
    s(t1, { bg: G, color: W, bold: true, size: 15, align: 'center' });
    ws.getRow(1).height = 36;

    // Sous-titre
    ws.mergeCells('A2:E2');
    const t2 = ws.getCell('A2');
    t2.value = `${COMPANY.activity}  ·  ${COMPANY.ville}  ·  ${COMPANY.email}`;
    s(t2, { bg: GL, color: '166534', align: 'center' });
    ws.getRow(2).height = 20;

    ws.addRow([]);

    // Infos commande
    const infos = [
      ['Facture N°',          invoiceNum],
      ["Date d'émission",     new Date(order.createdAt).toLocaleDateString('fr-FR')],
      ['', ''],
      ['Client',              order.customerName  || '-'],
      ['Téléphone',           order.customerPhone || '-'],
      ['Email',               order.customerEmail || '-'],
      ['Adresse livraison',   order.deliveryAddress || '-'],
      ['', ''],
      ['Mode de paiement',    payLabel(order.paymentMethod)],
      ['Statut commande',     statusLabel(order.status)],
    ];
    if (order.notes) infos.push(['Note', order.notes]);

    infos.forEach(([label, val]) => {
      if (!label) { ws.addRow([]); return; }
      const r = ws.addRow(['', label, '', val, '']);
      ws.mergeCells(`D${r.number}:E${r.number}`);
      s(r.getCell(2), { bold: true, color: G });
      r.getCell(4).font = { size: 11 };
    });

    ws.addRow([]);

    // Entête tableau
    const hRow = ws.addRow(['#', 'Désignation', 'Qté', 'Prix unitaire (FCFA)', 'Total (FCFA)']);
    hRow.eachCell(c => s(c, { bg: G, color: W, bold: true, align: 'center' }));
    ws.getRow(hRow.number).height = 24;

    // Lignes articles
    items.forEach((it, i) => {
      const r = ws.addRow([i + 1, it.name, it.qty || 1, it.price || 0, (it.price || 0) * (it.qty || 1)]);
      s(r.getCell(1), { align: 'center' });
      s(r.getCell(3), { align: 'center' });
      s(r.getCell(4), { num: true, align: 'right' });
      s(r.getCell(5), { num: true, align: 'right', bold: true });
      if (i % 2 === 0) r.eachCell(c => { if (!c.fill?.fgColor) s(c, { bg: 'F8FFF9' }); });
    });

    ws.addRow([]);

    // Totaux
    const totaux = [
      ['Montant HT',                    ht,           false, false],
      [`TVA (${(TVA_RATE*100).toFixed(2)}%)`, tva,   false, false],
      ...(promoInfo ? [[`Réduction (${promoInfo.code})`, -promoInfo.discount, false, true]] : []),
      ['TOTAL TTC (payé)',               order.total,  true, false],
    ];
    totaux.forEach(([label, val, isTotal, isDiscount]) => {
      const r = ws.addRow(['', '', '', label, val]);
      ws.mergeCells(`A${r.number}:C${r.number}`);
      s(r.getCell(4), { bold: true, color: isDiscount ? 'B45309' : G, align: 'right', ...(isTotal ? { size: 13 } : {}) });
      s(r.getCell(5), { num: true, align: 'right', bold: true, ...(isTotal ? { size: 13, bg: GL } : {}) });
      if (isTotal) s(r.getCell(4), { bg: GL });
      ws.getRow(r.number).height = isTotal ? 26 : 18;
    });

    ws.addRow([]); ws.addRow([]);

    // Footer
    ws.mergeCells(`A${ws.rowCount}:E${ws.rowCount}`);
    const fCell = ws.getCell(`A${ws.rowCount}`);
    fCell.value = `Merci pour votre confiance !  –  ${COMPANY.name}  ·  ${COMPANY.tel}  ·  RCCM : ${COMPANY.rccm}`;
    s(fCell, { italic: true, align: 'center' });
    fCell.font = { italic: true, color: { argb: 'FF888888' } };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoiceNum}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};
