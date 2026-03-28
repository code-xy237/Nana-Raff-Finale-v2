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

// Static files (frontend served from backend/public)
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/promos', require('./routes/promos'));

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV }));

// Webhooks Mobile Money
app.post('/webhook/om/notify', (req, res) => {
  console.log('[OM webhook]', req.body);
  res.json({ ok: true });
});
app.post('/webhook/momo/notify', (req, res) => {
  console.log('[MoMo webhook]', req.body);
  res.json({ ok: true });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.use(errorHandler);

// Sync DB and start
const PORT = process.env.PORT || 4000;
(async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ SQLite DB synced');
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 NANA RAFF running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB sync error:', err);
    process.exit(1);
  }
})();
