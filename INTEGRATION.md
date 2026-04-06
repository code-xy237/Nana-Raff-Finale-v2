# NANA RAFF – Guide d'intégration
# Systèmes : Facturation · Stock · Comptabilité

## 📁 Fichiers livrés

```
nanaraff-additions/
├── controllers/
│   ├── invoiceController.js      → Génère factures HTML (PDF) et Excel
│   ├── stockController.js        → Gestion stock produits
│   └── accountingController.js  → Rapport comptable TVA/CA
├── routes/
│   └── ALL_ROUTES.js            → 3 fichiers routes (à séparer)
├── ADMIN_HTML_ADDITIONS.html    → Panneaux + JS à insérer dans admin.html
└── INTEGRATION.md               → Ce fichier
```

---

## 🚀 Étapes d'intégration

### 1. Installer la dépendance Excel

```bash
cd backend
npm install exceljs
```

---

### 2. Copier les controllers

```bash
cp invoiceController.js   backend/controllers/
cp stockController.js     backend/controllers/
cp accountingController.js backend/controllers/
```

---

### 3. Créer les fichiers routes

**`backend/routes/invoices.js`**
```js
const router = require('express').Router();
const ctrl = require('../controllers/invoiceController');
const { protect, admin } = require('../middleware/auth');

router.get('/list',           protect, admin, ctrl.listInvoices);
router.get('/:orderId/pdf',   protect, admin, ctrl.getInvoicePDF);
router.get('/:orderId/excel', protect, admin, ctrl.getInvoiceExcel);

module.exports = router;
```

**`backend/routes/stock.js`**
```js
const router = require('express').Router();
const ctrl = require('../controllers/stockController');
const { protect, admin } = require('../middleware/auth');

router.get('/',         protect, admin, ctrl.getStockOverview);
router.get('/export',   protect, admin, ctrl.exportStockExcel);
router.patch('/:id',    protect, admin, ctrl.updateStock);

module.exports = router;
```

**`backend/routes/accounting.js`**
```js
const router = require('express').Router();
const ctrl = require('../controllers/accountingController');
const { protect, admin } = require('../middleware/auth');

router.get('/report', protect, admin, ctrl.getReport);
router.get('/export', protect, admin, ctrl.exportReport);

module.exports = router;
```

---

### 4. Enregistrer les routes dans server.js

Ajouter ces 3 lignes **après** les routes existantes :

```js
// ── Nouvelles routes admin ──
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/stock',      require('./routes/stock'));
app.use('/api/accounting', require('./routes/accounting'));
```

---

### 5. Modifier admin.html

Ouvrir `backend/public/admin.html` et :

**A) Dans `panelTitles`, ajouter :**
```js
invoices:   'Factures & Reçus',
stock:      'Gestion du stock',
accounting: 'Comptabilité',
```

**B) Dans `loadPanel(p)`, ajouter :**
```js
else if (p === 'invoices')   loadInvoices();
else if (p === 'stock')      loadStock();
else if (p === 'accounting') loadAccounting();
```

**C) Dans la sidebar, après le bouton "Avis clients", ajouter :**
```html
<div class="nav-section-label">Gestion</div>
<button class="nav-item" data-panel="invoices">
  <span class="icon">🧾</span> Factures
</button>
<button class="nav-item" data-panel="stock">
  <span class="icon">📦</span> Stock
</button>
<button class="nav-item" data-panel="accounting">
  <span class="icon">📊</span> Comptabilité
</button>
```

**D) Dans `<div class="admin-content">`, ajouter les 3 panneaux HTML**
(voir fichier `ADMIN_HTML_ADDITIONS.html` – sections "PANEL : FACTURES",
"PANEL : STOCK", "PANEL : COMPTABILITÉ")

**E) À la fin du `<script>` existant, coller tout le JavaScript**
(voir la section `<script>` à la fin de `ADMIN_HTML_ADDITIONS.html`)

---

## 🔐 Accès aux factures depuis le panneau "Commandes"

Dans la fonction `viewOrder()` de admin.html, dans le contenu du modal,
ajouter ce bloc en bas :

```js
<div style="display:flex;gap:8px;margin-top:18px;padding-top:14px;border-top:1px solid var(--border)">
  <a href="/api/invoices/${o.id}/pdf" target="_blank"
     style="flex:1;background:var(--primary);color:#fff;padding:10px;border-radius:10px;
            font-size:13px;font-weight:700;text-align:center;text-decoration:none">
    🧾 Voir la facture (PDF)
  </a>
  <a href="/api/invoices/${o.id}/excel"
     style="flex:1;background:#1d4ed8;color:#fff;padding:10px;border-radius:10px;
            font-size:13px;font-weight:700;text-align:center;text-decoration:none">
    📊 Télécharger Excel
  </a>
</div>
```

---

## 📋 Ce que fait chaque système

### 🧾 Facturation

| Route | Résultat |
|-------|----------|
| `GET /api/invoices/list` | JSON liste des factures |
| `GET /api/invoices/:id/pdf` | Page HTML imprimable → PDF via navigateur |
| `GET /api/invoices/:id/excel` | Fichier .xlsx téléchargeable |

La facture affiche :
- Numéro unique `NR-000001`
- Infos client (nom, tél, adresse)
- Tableau des articles (qté × prix)
- Montant HT + TVA 19,25% + Total TTC
- Mode de paiement + statut commande

### 📦 Stock

| Route | Résultat |
|-------|----------|
| `GET /api/stock` | JSON tous produits + stats globales |
| `PATCH /api/stock/:id` | Modifier stock (set / add / subtract) |
| `GET /api/stock/export` | Fichier Excel du stock complet |

Seuils : Rupture = 0 · Faible = ≤ 5 · OK = > 5

### 📊 Comptabilité

| Route | Résultat |
|-------|----------|
| `GET /api/accounting/report?from=&to=` | JSON rapport complet |
| `GET /api/accounting/export?from=&to=` | Excel 3 feuilles |

Le rapport calcule :
- **PV / TTC** = prix vendu au client
- **HT** = TTC ÷ 1.1925
- **TVA collectée** = HT × 19,25% (à reverser à la DGI)
- Ventilation par paiement (cash, Orange Money, MTN)
- Évolution mensuelle
- Top 10 produits par CA
- Export Excel 3 feuilles : Journal · Synthèse · Top Produits

---

## ✅ Vérification

Après intégration, tester dans le navigateur :
```
http://localhost:4000/api/invoices/list       → JSON
http://localhost:4000/api/invoices/1/pdf      → Facture HTML
http://localhost:4000/api/stock               → JSON stock
http://localhost:4000/api/accounting/report   → JSON rapport
```
