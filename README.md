# NANA RAFF – E-commerce Santé & Beauté

Application e-commerce complète (boutique + dashboard admin) pour NANA RAFF.

## 🚀 Stack technique

- **Backend** : Node.js + Express + Sequelize + SQLite
- **Frontend** : HTML/CSS/JS vanilla (servi par Express)
- **Auth** : JWT (JSON Web Tokens)
- **DB** : SQLite (fichier local, volume Railway)

## 📁 Structure

```
backend/
├── controllers/     # Logique métier
├── middleware/      # Auth JWT, errorHandler
├── models/          # Sequelize models (User, Product, Order, Review, Promo)
├── routes/          # Express routes
├── seed/            # Données de départ
├── public/          # Frontend statique
│   ├── index.html   # Page d'accueil
│   ├── produits.html# Catalogue produits
│   ├── login.html   # Connexion/Inscription
│   ├── admin.html   # Dashboard admin
│   ├── services.html
│   ├── contact.html
│   ├── style.css
│   └── app.js
├── data/            # SQLite DB (créé automatiquement)
├── server.js        # Point d'entrée
├── railway.json
└── Procfile
```

## ⚙️ Variables d'environnement (Railway Dashboard)

| Variable | Valeur | Requis |
|----------|--------|--------|
| `JWT_SECRET` | Chaîne aléatoire longue | ✅ |
| `PORT` | Auto (Railway) | Auto |
| `NODE_ENV` | `production` | ✅ |
| `ADMIN_EMAIL` | Email admin | Pour seed |
| `ADMIN_PASSWORD` | Mot de passe admin | Pour seed |

## 🗄️ Déploiement Railway

### 1. Préparer le projet

```bash
cd backend
npm install
```

### 2. Initialiser la BDD (première fois)

```bash
npm run seed
```

Crée : admin + 6 produits de démo + 2 codes promo.

### 3. Déployer sur Railway

```bash
# Option A : Via GitHub
# 1. Pusher le dossier backend/ sur GitHub
# 2. New Project → Deploy from GitHub repo → sélectionner le repo
# 3. Ajouter les variables d'env dans Settings > Variables

# Option B : Via Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### 4. Volume pour SQLite (persistance)

Dans Railway Dashboard :
- Settings → Volumes → Add Volume
- Mount Path : `/app/data`
- Puis définir `DB_PATH=/app/data/nanaraff.sqlite`

## 🔑 Comptes par défaut (après seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@nanaraff.com | Admin@2024! |
| Client | marie@example.com | user1234 |

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` – Inscription
- `POST /api/auth/login` – Connexion
- `GET /api/auth/me` – Profil (auth)

### Produits
- `GET /api/products` – Liste (public)
- `POST /api/products` – Créer (admin)
- `PUT /api/products/:id` – Modifier (admin)
- `DELETE /api/products/:id` – Supprimer (admin)

### Commandes
- `POST /api/orders` – Créer commande
- `GET /api/orders` – Mes commandes (auth)
- `PATCH /api/orders/:id/status` – Statut (admin)
- `GET /api/orders/stats` – Stats (admin)

### Promos
- `GET /api/promos` – Liste (admin)
- `POST /api/promos` – Créer (admin)
- `POST /api/promos/validate` – Valider code (public)

### Utilisateurs
- `GET /api/users` – Liste (admin)
- `PUT /api/users/:id` – Modifier (admin)
- `DELETE /api/users/:id` – Supprimer (admin)

## 🌐 Pages Frontend

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Hero + produits + panier |
| Catalogue | `/produits.html` | Filtres + recherche + avis |
| Connexion | `/login.html` | Login + inscription |
| Dashboard | `/admin.html` | Gestion complète (admin) |
| Services | `/services.html` | Offres & tarifs |
| Contact | `/contact.html` | Formulaire contact |

## 🛒 Fonctionnalités

- ✅ Authentification JWT (login/inscription/déconnexion)
- ✅ Catalogue produits avec filtres/recherche/tri
- ✅ Panier persistant (localStorage)
- ✅ Codes promo (% ou montant fixe)
- ✅ Commandes avec paiement Mobile Money / cash
- ✅ Avis clients avec likes
- ✅ Dashboard admin complet :
  - KPIs + graphiques (Chart.js)
  - Gestion commandes (statuts)
  - CRUD produits
  - CRUD codes promo
  - Gestion utilisateurs
- ✅ Responsive mobile
- ✅ Railway-ready (un seul service)
