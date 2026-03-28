const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dossier uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `prod_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non supporté. Utilisez JPG, PNG ou WEBP.'));
  }
});

// Routes fixes AVANT les routes avec :id
router.get('/', ctrl.list);
router.get('/stats', protect, admin, ctrl.stats);

// Upload image AVANT /:id pour eviter la confusion
router.post('/upload-image', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'Aucun fichier recu' });
  const url = '/uploads/' + req.file.filename;
  res.json({ url, filename: req.file.filename });
});

// Routes avec :id en dernier
router.get('/:id', ctrl.get);
router.post('/', protect, admin, ctrl.create);
router.put('/:id', protect, admin, ctrl.update);
router.delete('/:id', protect, admin, ctrl.delete);

module.exports = router;
