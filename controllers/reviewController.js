const { Review } = require('../models');

exports.add = async (req, res, next) => {
  try {
    const pid = req.params.productId;
    const { rating, comment, name } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ msg: 'Note invalide (1-5)' });
    const r = await Review.create({
      productId: pid,
      userId: req.user ? req.user.id : null,
      name: req.user ? req.user.name : (name || 'Invité'),
      rating, comment
    });
    res.status(201).json(r);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const pid = req.params.productId;
    const reviews = await Review.findAll({
      where: { productId: pid, approved: true },
      order: [['createdAt', 'DESC']]
    });
    res.json(reviews);
  } catch (err) { next(err); }
};

exports.like = async (req, res, next) => {
  try {
    const r = await Review.findByPk(req.params.id);
    if (!r) return res.status(404).json({ msg: 'Avis introuvable' });
    r.likes = (r.likes || 0) + 1;
    await r.save();
    res.json(r);
  } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
  try {
    const r = await Review.findByPk(req.params.id);
    if (!r) return res.status(404).json({ msg: 'Avis introuvable' });
    await r.destroy();
    res.json({ msg: 'Avis supprimé' });
  } catch (err) { next(err); }
};
