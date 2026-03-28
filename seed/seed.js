require('dotenv').config();
const { sequelize, User, Product, Promo } = require('../models');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nanaraff.com';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Shalom123@';

(async () => {
  await sequelize.sync({ force: true });
  console.log('DB synced');

  await User.create({ name: 'Admin NANA RAFF', email: ADMIN_EMAIL, password: ADMIN_PASS, role: 'admin' });
  await User.create({ name: 'Marie Dupont', email: 'marie@example.com', password: 'user1234', role: 'user' });
  await User.create({ name: 'Jean Kamga', email: 'jean@example.com', password: 'user1234', role: 'user' });
  console.log('Users created');

  await Product.bulkCreate([
    { name: 'Thé Détox Vital', short: 'Infusion drainante 100% bio', description: 'Notre thé détox est une infusion premium composée de plantes soigneusement sélectionnées pour leurs vertus drainantes et purifiantes. Idéal pour accompagner une cure minceur.', price: 4500, stock: 40, category: 'thé', featured: true, images: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600'], tags: ['bio', 'détox', 'minceur'] },
    { name: 'Brûleur Pro+', short: 'Complément thermogène naturel', description: 'Formule avancée pour booster votre métabolisme naturellement. Contient du thé vert, de la caféine naturelle et des extraits de plantes.', price: 9500, stock: 18, category: 'compléments', featured: true, images: ['https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600'], tags: ['minceur', 'énergie'] },
    { name: 'Shaker VitalFit 600ml', short: 'Shaker ergonomique avec filtret', description: 'Shaker de qualité professionnelle avec filtre anti-grumeaux et graduation précise. Parfait pour vos shakes protéinés.', price: 3500, stock: 60, category: 'accessoires', images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600'], tags: ['sport', 'accessoire'] },
    { name: 'Collagène Marine Premium', short: 'Hydratation & élasticité peau', description: 'Collagène marin hydrolysé de haute qualité pour une peau hydratée, élastique et jeune. Enrichi en vitamine C.', price: 12500, stock: 25, category: 'beauté', featured: true, images: ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600'], tags: ['beauté', 'peau', 'anti-âge'] },
    { name: 'Spiruline Bio 200g', short: 'Super-aliment protéiné', description: 'La spiruline est l\'un des aliments les plus nutritifs au monde. Riche en protéines, vitamines et minéraux essentiels.', price: 7500, stock: 35, category: 'compléments', images: ['https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600'], tags: ['bio', 'protéines', 'énergie'] },
    { name: 'Huile de Coco Bio 500ml', short: 'Usage culinaire & cosmétique', description: 'Huile de coco vierge pressée à froid, certifiée bio. Idéale en cuisine ou comme soin beauté naturel pour cheveux et peau.', price: 5500, stock: 50, category: 'nutrition', images: ['https://images.unsplash.com/photo-1526931887096-8ece7e1ced75?w=600'], tags: ['bio', 'cuisine', 'beauté'] }
  ]);
  console.log('Products created');

  await Promo.bulkCreate([
    { code: 'BIENVENUE10', type: 'percent', value: 10, description: 'Réduction bienvenue 10%', maxUses: 100 },
    { code: 'NOEL2024', type: 'fixed', value: 2000, description: 'Réduction Noël 2000 FCFA', minOrder: 10000, maxUses: 50 }
  ]);
  console.log('Promos created');

  console.log('\n=== SEED TERMINÉ ===');
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASS}`);
  process.exit(0);
})();
