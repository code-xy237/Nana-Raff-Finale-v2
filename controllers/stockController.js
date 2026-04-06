// controllers/stockController.js – Gestion du stock NANA RAFF
const { Product } = require('../models');
const { Op }      = require('sequelize');
const ExcelJS     = require('exceljs');

const SEUIL_FAIBLE = 5;

// ─── Vue globale du stock ──────────────────────────────────────────────────────
exports.getStockOverview = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'category', 'brand', 'stock', 'price', 'active', 'images'],
      order: [['stock', 'ASC'], ['name', 'ASC']],
    });

    const stats = {
      totalProduits: products.length,
      rupture:       products.filter(p => p.stock === 0).length,
      faible:        products.filter(p => p.stock > 0 && p.stock <= SEUIL_FAIBLE).length,
      ok:            products.filter(p => p.stock > SEUIL_FAIBLE).length,
      totalUnites:   products.reduce((s, p) => s + (p.stock || 0), 0),
      valeurTotale:  products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0),
    };

    // Regroupement par catégorie
    const parCategorie = {};
    products.forEach(p => {
      const cat = p.category || 'Sans catégorie';
      if (!parCategorie[cat]) parCategorie[cat] = { total: 0, rupture: 0, unites: 0, valeur: 0 };
      parCategorie[cat].total++;
      parCategorie[cat].unites += p.stock || 0;
      parCategorie[cat].valeur += (p.stock || 0) * (p.price || 0);
      if (p.stock === 0) parCategorie[cat].rupture++;
    });

    res.json({ products, stats, parCategorie, seuilFaible: SEUIL_FAIBLE });
  } catch (err) { next(err); }
};

// ─── Modifier le stock d'un produit ──────────────────────────────────────────
exports.updateStock = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ msg: 'Produit introuvable' });

    const { stock, operation } = req.body;
    const qty = parseInt(stock);
    if (isNaN(qty) || qty < 0) return res.status(400).json({ msg: 'Quantité invalide' });

    if (operation === 'add') {
      product.stock = (product.stock || 0) + qty;
    } else if (operation === 'subtract') {
      product.stock = Math.max(0, (product.stock || 0) - qty);
    } else {
      product.stock = qty;
    }

    await product.save();
    res.json({
      id: product.id, name: product.name,
      stock: product.stock,
      statut: product.stock === 0 ? 'rupture' : product.stock <= SEUIL_FAIBLE ? 'faible' : 'ok'
    });
  } catch (err) { next(err); }
};

// ─── Export Excel du stock ────────────────────────────────────────────────────
exports.exportStockExcel = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      attributes: ['id', 'name', 'category', 'brand', 'stock', 'price', 'active'],
      order: [['category', 'ASC'], ['stock', 'ASC']],
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'NANA RAFF';
    const ws  = wb.addWorksheet('Stock Produits');

    ws.columns = [
      { key: 'id',       header: 'ID',            width: 8  },
      { key: 'name',     header: 'Produit',        width: 36 },
      { key: 'category', header: 'Catégorie',      width: 18 },
      { key: 'brand',    header: 'Marque',         width: 18 },
      { key: 'stock',    header: 'Stock',          width: 10 },
      { key: 'status',   header: 'Statut',         width: 14 },
      { key: 'price',    header: 'Prix (FCFA)',    width: 16 },
      { key: 'valeur',   header: 'Valeur stock',   width: 18 },
    ];

    // En-tête
    const hRow = ws.getRow(1);
    hRow.height = 24;
    hRow.eachCell(c => {
      c.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A2A' } };
      c.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      c.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const dateExport = new Date().toLocaleDateString('fr-FR');

    products.forEach((p, i) => {
      const statut = p.stock === 0 ? 'RUPTURE' : p.stock <= SEUIL_FAIBLE ? 'FAIBLE' : 'OK';
      const r = ws.addRow({
        id:       p.id,
        name:     p.name,
        category: p.category || '-',
        brand:    p.brand    || '-',
        stock:    p.stock    || 0,
        status:   statut,
        price:    p.price    || 0,
        valeur:   (p.stock || 0) * (p.price || 0),
      });

      r.getCell('stock').alignment = { horizontal: 'center' };
      r.getCell('status').alignment = { horizontal: 'center' };
      r.getCell('price').numFmt  = '#,##0';
      r.getCell('valeur').numFmt = '#,##0';

      const bg = statut === 'RUPTURE' ? 'FEE2E2' : statut === 'FAIBLE' ? 'FEF9C3' : 'D1FAE5';
      const fg = statut === 'RUPTURE' ? 'B91C1C' : statut === 'FAIBLE' ? '92400E' : '065F46';
      r.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } };
      r.getCell('status').font = { bold: true, color: { argb: 'FF' + fg } };

      if (i % 2 === 0) {
        ['id','name','category','brand','stock','price','valeur'].forEach(k => {
          if (!r.getCell(k).fill?.fgColor?.argb || r.getCell(k).fill.fgColor.argb === 'FFFFFFFF')
            r.getCell(k).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FFF9' } };
        });
      }
    });

    // Ligne récapitulative
    ws.addRow([]);
    const totRow = ws.addRow({
      name:   `TOTAL – ${products.length} produits – Export du ${dateExport}`,
      stock:  products.reduce((s, p) => s + (p.stock || 0), 0),
      valeur: products.reduce((s, p) => s + (p.stock || 0) * (p.price || 0), 0),
    });
    totRow.getCell('name').font   = { bold: true, color: { argb: 'FF1A3A2A' } };
    totRow.getCell('stock').font  = { bold: true };
    totRow.getCell('valeur').numFmt = '#,##0';
    totRow.getCell('valeur').font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="stock-nanaraff-${dateExport.replace(/\//g,'-')}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};
