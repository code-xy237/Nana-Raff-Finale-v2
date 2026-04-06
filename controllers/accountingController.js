// controllers/accountingController.js – Comptabilité NANA RAFF
const { Order, Product } = require('../models');
const { Op }   = require('sequelize');
const ExcelJS  = require('exceljs');

const TVA_RATE = 0.1925; // 19,25% Cameroun

function statusLabel(s) {
  const m = { pending:'En attente', processing:'En cours', shipped:'Expédié', delivered:'Livré', cancelled:'Annulé' };
  return m[s] || s;
}

function payLabelFn(m) {
  const map = { cash:'Paiement livraison', orange_money:'Orange Money', mtn_momo:'MTN Mobile Money' };
  return map[m] || m || 'Inconnu';
}

function calcOrder(o) {
  const items  = o.items || [];
  const ttc    = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
  const tva    = Math.round(ttc * TVA_RATE);
  const ht     = ttc - tva;
  return { ttc, tva, ht };
}

// ─── Rapport comptable JSON ────────────────────────────────────────────────────
exports.getReport = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.in]: ['delivered', 'shipped', 'processing'] };
    }
    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from + 'T00:00:00'), new Date(to + 'T23:59:59')] };
    }

    const orders = await Order.findAll({ where, order: [['createdAt', 'DESC']] });

    let totalTTC = 0, totalTVA = 0, totalHT = 0;
    const parPaiement = {}, parMois = {}, parProduit = {};

    orders.forEach(o => {
      const { ttc, tva, ht } = calcOrder(o);
      totalTTC += ttc; totalTVA += tva; totalHT += ht;

      const pm = o.paymentMethod || 'inconnu';
      if (!parPaiement[pm]) parPaiement[pm] = { nb: 0, ttc: 0 };
      parPaiement[pm].nb++;
      parPaiement[pm].ttc += ttc;

      const moisKey = new Date(o.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!parMois[moisKey]) parMois[moisKey] = { nb: 0, ttc: 0, tva: 0, ht: 0 };
      parMois[moisKey].nb++;
      parMois[moisKey].ttc += ttc;
      parMois[moisKey].tva += tva;
      parMois[moisKey].ht  += ht;

      (o.items || []).forEach(it => {
        const key = it.name || 'Inconnu';
        if (!parProduit[key]) parProduit[key] = { nb: 0, qte: 0, ttc: 0 };
        parProduit[key].nb++;
        parProduit[key].qte += it.qty || 1;
        parProduit[key].ttc += (it.price || 0) * (it.qty || 1);
      });
    });

    const top10 = Object.entries(parProduit)
      .sort((a, b) => b[1].ttc - a[1].ttc)
      .slice(0, 10)
      .map(([nom, d]) => ({ nom, ...d, tva: Math.round(d.ttc * TVA_RATE), ht: Math.round(d.ttc - d.ttc * TVA_RATE) }));

    res.json({
      periode:       { from: from || null, to: to || null },
      filtreStatut:  status || 'delivered+shipped+processing',
      synthese: {
        nbCommandes:   orders.length,
        totalTTC:      Math.round(totalTTC),
        totalTVA:      Math.round(totalTVA),
        totalHT:       Math.round(totalHT),
        panierMoyen:   orders.length > 0 ? Math.round(totalTTC / orders.length) : 0,
        tauxTVA:       `${(TVA_RATE * 100).toFixed(2)}%`,
        tvaAReverser:  Math.round(totalTVA),
      },
      parPaiement,
      parMois,
      top10Produits: top10,
    });
  } catch (err) { next(err); }
};

// ─── Export Excel complet ──────────────────────────────────────────────────────
exports.exportReport = async (req, res, next) => {
  try {
    const { from, to, status } = req.query;
    const where = {};

    if (status) where.status = status;
    else where.status = { [Op.in]: ['delivered', 'shipped', 'processing'] };

    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from + 'T00:00:00'), new Date(to + 'T23:59:59')] };
    }

    const orders = await Order.findAll({ where, order: [['createdAt', 'ASC']] });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'NANA RAFF';

    // ── Feuille 1 : Journal des ventes ────────────────────────────────────────
    const ws1 = wb.addWorksheet('Journal des ventes');
    ws1.columns = [
      { key: 'num',      header: 'Facture',       width: 14 },
      { key: 'date',     header: 'Date',          width: 16 },
      { key: 'client',   header: 'Client',        width: 26 },
      { key: 'tel',      header: 'Téléphone',     width: 16 },
      { key: 'paiement', header: 'Paiement',      width: 18 },
      { key: 'statut',   header: 'Statut',        width: 14 },
      { key: 'ht',       header: 'HT (FCFA)',     width: 16 },
      { key: 'tva',      header: 'TVA (FCFA)',    width: 16 },
      { key: 'ttc',      header: 'TTC (FCFA)',    width: 16 },
    ];

    addTitleRow(ws1, `NANA RAFF – Journal des ventes${from ? ` · Du ${from} au ${to}` : ''}`);
    styleHeader(ws1);

    let sumHT = 0, sumTVA = 0, sumTTC = 0;
    orders.forEach((o, i) => {
      const { ttc, tva, ht } = calcOrder(o);
      sumHT += ht; sumTVA += tva; sumTTC += ttc;

      const r = ws1.addRow({
        num:      `NR-${String(o.id).padStart(6,'0')}`,
        date:     new Date(o.createdAt).toLocaleDateString('fr-FR'),
        client:   o.customerName  || '-',
        tel:      o.customerPhone || '-',
        paiement: payLabelFn(o.paymentMethod),
        statut:   statusLabel(o.status),
        ht: Math.round(ht), tva: Math.round(tva), ttc: Math.round(ttc),
      });
      ['ht','tva','ttc'].forEach(k => { r.getCell(k).numFmt = '#,##0'; });
      if (i % 2 === 0) {
        r.eachCell(c => {
          const argb = c.fill?.fgColor?.argb;
          if (!argb || argb === 'FFFFFFFF') {
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FFF9' } };
          }
        });
      }
    });

    ws1.addRow([]);
    const tot1 = ws1.addRow({
      num: 'TOTAL', ht: Math.round(sumHT), tva: Math.round(sumTVA), ttc: Math.round(sumTTC)
    });
    ['num','ht','tva','ttc'].forEach(k => { tot1.getCell(k).font = { bold: true, color: { argb: 'FF1A3A2A' } }; });
    ['ht','tva','ttc'].forEach(k => {
      tot1.getCell(k).numFmt = '#,##0';
      tot1.getCell(k).fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5EE' } };
    });

    // ── Feuille 2 : Synthèse comptable ────────────────────────────────────────
    const ws2 = wb.addWorksheet('Synthèse comptable');
    ws2.columns = [{ width: 6 }, { width: 38 }, { width: 6 }, { width: 24 }, { width: 6 }];

    ws2.mergeCells('A1:E1');
    const t2 = ws2.getCell('A1');
    t2.value     = 'NANA RAFF – Rapport Comptable';
    t2.font      = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    t2.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A2A' } };
    t2.alignment = { horizontal: 'center', vertical: 'middle' };
    ws2.getRow(1).height = 36;
    ws2.addRow([]);

    const addSec = (ws, titre) => {
      const r = ws.addRow(['', titre]);
      ws.mergeCells(`B${r.number}:D${r.number}`);
      r.getCell(2).font = { bold: true, size: 12, color: { argb: 'FF1A3A2A' } };
      r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5EE' } };
      ws.getRow(r.number).height = 22;
    };
    const addKV = (ws, label, val, isMoney = false) => {
      const r = ws.addRow(['', label, '', val]);
      r.getCell(2).font = { bold: true };
      if (isMoney) r.getCell(4).numFmt = '#,##0';
      r.getCell(4).alignment = { horizontal: 'right' };
    };

    addSec(ws2, '📊 SYNTHÈSE GÉNÉRALE');
    addKV(ws2, 'Période',              from ? `Du ${from} au ${to}` : 'Toutes périodes');
    addKV(ws2, 'Nombre de commandes',  orders.length);
    addKV(ws2, 'Panier moyen (TTC)',   orders.length > 0 ? Math.round(sumTTC / orders.length) : 0, true);
    ws2.addRow([]);

    addSec(ws2, "💰 CHIFFRE D'AFFAIRES");
    addKV(ws2, 'Total HT (Hors Taxe)',               Math.round(sumHT),  true);
    addKV(ws2, `TVA collectée (${(TVA_RATE*100).toFixed(2)}%)`, Math.round(sumTVA), true);
    addKV(ws2, 'Total TTC (Prix de vente)',           Math.round(sumTTC), true);
    ws2.addRow([]);

    // Ventilation par paiement
    const parPM = {};
    orders.forEach(o => {
      const { ttc } = calcOrder(o);
      const pm = o.paymentMethod || 'inconnu';
      if (!parPM[pm]) parPM[pm] = { nb: 0, ttc: 0 };
      parPM[pm].nb++; parPM[pm].ttc += ttc;
    });

    addSec(ws2, '💳 VENTILATION PAR MODE DE PAIEMENT');
    Object.entries(parPM).forEach(([pm, d]) => {
      addKV(ws2, `${payLabelFn(pm)}  (${d.nb} commande${d.nb > 1 ? 's' : ''})`, Math.round(d.ttc), true);
    });
    ws2.addRow([]);

    addSec(ws2, '📌 NOTE FISCALE');
    const noteRow = ws2.addRow(['',
      `TVA au taux de ${(TVA_RATE*100).toFixed(2)}% (Cameroun). ` +
      `Montant à reverser à la DGI : ${new Intl.NumberFormat('fr-FR').format(Math.round(sumTVA))} FCFA`
    ]);
    ws2.mergeCells(`B${noteRow.number}:E${noteRow.number}`);
    noteRow.getCell(2).font = { italic: true, color: { argb: 'FF555555' } };

    // ── Feuille 3 : Top produits ───────────────────────────────────────────────
    const ws3 = wb.addWorksheet('Top Produits');
    ws3.columns = [
      { key: 'rang', header: 'Rang',         width: 8  },
      { key: 'nom',  header: 'Produit',      width: 36 },
      { key: 'qte',  header: 'Qté vendue',   width: 14 },
      { key: 'ttc',  header: 'CA TTC (FCFA)', width: 18 },
      { key: 'tva',  header: 'TVA (FCFA)',   width: 16 },
      { key: 'ht',   header: 'CA HT (FCFA)', width: 16 },
    ];

    addTitleRow(ws3, 'NANA RAFF – Top des ventes par produit');
    styleHeader(ws3);

    const prodMap = {};
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        const k = it.name || 'Inconnu';
        if (!prodMap[k]) prodMap[k] = { qte: 0, ttc: 0 };
        prodMap[k].qte += it.qty || 1;
        prodMap[k].ttc += (it.price || 0) * (it.qty || 1);
      });
    });

    Object.entries(prodMap)
      .sort((a, b) => b[1].ttc - a[1].ttc)
      .forEach(([nom, d], i) => {
        const ttc = Math.round(d.ttc);
        const tva = Math.round(ttc * TVA_RATE);
        const ht  = ttc - tva;
        const r   = ws3.addRow({ rang: i + 1, nom, qte: d.qte, ttc, tva, ht });
        ['ttc','tva','ht'].forEach(k => { r.getCell(k).numFmt = '#,##0'; });
        r.getCell('rang').alignment = { horizontal: 'center' };
        if (i === 0) r.eachCell(c => {
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } };
          c.font = { bold: true };
        });
      });

    const dateExport = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="comptabilite-nanaraff-${dateExport}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

// ── Helpers Excel ──────────────────────────────────────────────────────────────
function addTitleRow(ws, titre) {
  ws.mergeCells('A1:I1');
  const c = ws.getCell('A1');
  c.value     = titre;
  c.font      = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
  c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A2A' } };
  c.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;
}

function styleHeader(ws) {
  const hRow = ws.getRow(2);
  hRow.height = 22;
  hRow.eachCell(c => {
    c.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27AE60' } };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}
