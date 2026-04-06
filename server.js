require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/reviews',    require('./routes/reviews'));
app.use('/api/orders',     require('./routes/orders'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/promos',     require('./routes/promos'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/stock',      require('./routes/stock'));       // AJOUTÉ
app.use('/api/accounting', require('./routes/accounting')); // AJOUTÉ

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV }));

// Webhooks Mobile Money
app.post('/webhook/om/notify',   (req, res) => { console.log('[OM webhook]', req.body); res.json({ ok: true }); });
app.post('/webhook/momo/notify', (req, res) => { console.log('[MoMo webhook]', req.body); res.json({ ok: true }); });

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.sync({ alter: true }); // alter:true pour appliquer les nouveaux champs
    console.log('✅ SQLite DB synced');

    const { User } = require('./models');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nanaraff.com';
    const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@2024!';
    const existing   = await User.findOne({ where: { email: adminEmail } });
    if (!existing) {
      await User.create({ name: 'Admin NANA RAFF', email: adminEmail, password: adminPass, role: 'admin' });
      console.log(`✅ Admin créé : ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin déjà présent : ${adminEmail}`);
    }

    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 NANA RAFF running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB sync error:', err);
    process.exit(1);
  }
})();
