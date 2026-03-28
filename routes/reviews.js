// reviews.js
const express = require('express');
const r = express.Router();
const ctrl = require('../controllers/reviewController');
const { protect, admin, optionalAuth } = require('../middleware/auth');

r.get('/:productId', ctrl.list);
r.post('/:productId', optionalAuth, ctrl.add);
r.patch('/:id/like', ctrl.like);
r.delete('/:id', protect, admin, ctrl.delete);

module.exports = r;
