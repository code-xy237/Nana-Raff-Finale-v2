const { User, Order } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res, next) => {
  try {
    const { q, role, active, page = 1, limit = 20 } = req.query;
    const where = {};
    if (q) where[Op.or] = [
      { name:  { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ];
    if (role) where.role = role;
    if (active !== undefined && active !== '') where.active = active === '1' || active === 'true';

    const { rows: users, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ users, total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) });
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });
    res.json(u);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });

    // Empêcher de dégrader le dernier admin
    const { name, email, phone, address, role, active } = req.body;
    if ((role && role !== 'admin') || active === false || active === 'false') {
      if (u.role === 'admin') {
        const adminCount = await User.count({ where: { role: 'admin', active: true } });
        if (adminCount <= 1) return res.status(403).json({ msg: 'Impossible de modifier le dernier administrateur actif' });
      }
    }

    // Vérifier unicité email si changé
    if (email && email !== u.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ msg: 'Cet email est déjà utilisé' });
    }

    if (name   !== undefined) u.name   = name;
    if (email  !== undefined) u.email  = email;
    if (phone  !== undefined) u.phone  = phone;
    if (address !== undefined) u.address = address;
    if (role   !== undefined) u.role   = role;
    if (active !== undefined) u.active = active === true || active === 'true' || active === 1;

    await u.save();
    res.json({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, phone: u.phone });
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });
    if (u.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) return res.status(403).json({ msg: 'Impossible de supprimer le dernier administrateur' });
    }
    // Dissocier les commandes de cet utilisateur (ne pas les supprimer)
    await Order.update({ userId: null }, { where: { userId: u.id } });
    await u.destroy();
    res.json({ msg: 'Utilisateur supprimé avec succès' });
  } catch (err) { next(err); }
};

exports.stats = async (req, res, next) => {
  try {
    const total    = await User.count();
    const admins   = await User.count({ where: { role: 'admin' } });
    const inactive = await User.count({ where: { active: false } });
    const newThisMonth = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });
    res.json({ total, admins, regular: total - admins, inactive, active: total - inactive, newThisMonth });
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ msg: 'Utilisateur introuvable' });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ msg: 'Mot de passe trop court (min 6 caractères)' });
    u.password = newPassword;
    await u.save();
    res.json({ msg: 'Mot de passe réinitialisé avec succès' });
  } catch (err) { next(err); }
};
