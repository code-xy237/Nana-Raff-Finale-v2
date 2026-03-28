const { Order, Product, User, Promo } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res, next) => {
  try {
    const { items, paymentMethod, customerName, customerEmail, customerPhone, deliveryAddress, notes, promoCode } = req.body;
    if (!items || !items.length) return res.status(400).json({ msg: 'Panier vide' });

    let total = 0;
    const orderItems = [];
    for (const it of items) {
      const p = await Product.findByPk(it.productId);
      if (!p) return res.status(400).json({ msg: `Produit ${it.productId} introuvable` });
      if (p.stock < (it.qty || 1)) return res.status(400).json({ msg: `Stock insuffisant pour ${p.name}` });
      orderItems.push({ productId: p.id, name: p.name, price: p.price, qty: it.qty || 1 });
      total += p.price * (it.qty || 1);
      // Deduct stock
      await p.update({ stock: p.stock - (it.qty || 1) });
    }

    // Apply promo
    let promoApplied = null;
    if (promoCode) {
      const promo = await Promo.findOne({ where: { code: promoCode.toUpperCase(), active: true } });
      if (promo && (!promo.expiresAt || new Date(promo.expiresAt) > new Date()) && (promo.maxUses === 0 || promo.usedCount < promo.maxUses) && total >= promo.minOrder) {
        const discount = promo.type === 'percent' ? Math.floor(total * promo.value / 100) : promo.value;
        total = Math.max(0, total - discount);
        promo.usedCount += 1;
        await promo.save();
        promoApplied = { code: promo.code, discount };
      }
    }

    const order = await Order.create({
      userId: req.user ? req.user.id : null,
      customerName: customerName || (req.user ? req.user.name : 'Invité'),
      customerEmail: customerEmail || (req.user ? req.user.email : null),
      customerPhone,
      deliveryAddress,
      items: orderItems,
      total,
      paymentMethod: paymentMethod || 'cash',
      notes,
      paymentInfo: JSON.stringify({ status: 'pending', promoApplied })
    });

    res.status(201).json({ order, promoApplied, msg: 'Commande créée avec succès' });
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    // Non-admin: only own orders
    if (req.user.role !== 'admin') where.userId = req.user.id;
    const { rows: orders, count } = await Order.findAndCountAll({
      where, order: [['createdAt', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ orders, total: count, page: parseInt(page), pages: Math.ceil(count / limit) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const o = await Order.findByPk(req.params.id);
    if (!o) return res.status(404).json({ msg: 'Commande introuvable' });
    if (req.user.role !== 'admin' && o.userId !== req.user.id) return res.status(403).json({ msg: 'Accès refusé' });
    res.json(o);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const o = await Order.findByPk(req.params.id);
    if (!o) return res.status(404).json({ msg: 'Commande introuvable' });
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ msg: 'Statut invalide' });
    await o.update({ status });
    res.json(o);
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const total = await Order.count();
    const pending = await Order.count({ where: { status: 'pending' } });
    const processing = await Order.count({ where: { status: 'processing' } });
    const delivered = await Order.count({ where: { status: 'delivered' } });
    const cancelled = await Order.count({ where: { status: 'cancelled' } });

    // Revenue from delivered orders
    const deliveredOrders = await Order.findAll({ where: { status: 'delivered' } });
    const revenue = deliveredOrders.reduce((s, o) => s + o.total, 0);

    // Monthly revenue (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthOrders = await Order.findAll({ where: { createdAt: { [Op.between]: [start, end] } } });
      months.push({
        label: d.toLocaleString('fr', { month: 'short' }),
        orders: monthOrders.length,
        revenue: monthOrders.reduce((s, o) => s + o.total, 0)
      });
    }

    res.json({ total, pending, processing, delivered, cancelled, revenue, months });
  } catch (err) { next(err); }
};
