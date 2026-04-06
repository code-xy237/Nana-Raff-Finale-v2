require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
const { sequelize } = require('./models');
const errorHandler  = require('./middleware/errorHandler');

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── Fichiers statiques ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Routes API ─────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/promos',     require('./routes/promos'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/stock',      require('./routes/stock'));
app.use('/api/accounting', require('./routes/accounting'));

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  ok: true,
  env: process.env.NODE_ENV,
  db: process.env.DATABASE_URL ? 'postgresql' : 'sqlite'
}));

// ── Webhooks Mobile Money ──────────────────────────────────────────────────
app.post('/webhook/om/notify',   (req, res) => { console.log('[OM webhook]',   req.body); res.json({ ok: true }); });
app.post('/webhook/momo/notify', (req, res) => { console.log('[MoMo webhook]', req.body); res.json({ ok: true }); });

// ── SPA fallback ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.use(errorHandler);

// ── Démarrage ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    // alter:true → ajoute les nouvelles colonnes sans jamais supprimer les données
    await sequelize.sync({ alter: true });
    const dbType = process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite';
    console.log(`✅ Base de données ${dbType} synchronisée`);

    // Créer l'admin s'il n'existe pas encore
    const { User } = require('./models');
    const adminEmail = process.env.ADMIN_EMAIL    || 'admin@nanaraff.com';
    const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@2024!';
    const existing   = await User.findOne({ where: { email: adminEmail } });
    if (!existing) {
      await User.create({ name: 'Admin NANA RAFF', email: adminEmail, password: adminPass, role: 'admin' });
      console.log(`✅ Compte admin créé : ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin déjà présent : ${adminEmail}`);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 NANA RAFF running on port ${PORT} [${dbType}]`);
    });
  } catch (err) {
    console.error('❌ Erreur démarrage :', err);
    process.exit(1);
  }
})();
