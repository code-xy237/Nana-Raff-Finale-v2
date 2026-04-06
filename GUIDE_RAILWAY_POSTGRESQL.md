# 🚀 Guide : Migrer vers PostgreSQL sur Railway (données persistantes)

## Pourquoi ce changement ?

Avec SQLite, la base de données était un **fichier sur le disque** du conteneur Railway.
À chaque déploiement (push GitHub), Railway recrée le conteneur → le fichier disparaît →
**toutes les données (produits, commandes, utilisateurs) sont perdues**.

Avec **PostgreSQL**, la base de données est un **service séparé et permanent**.
Les déploiements n'y touchent jamais.

---

## Étapes sur Railway (à faire une seule fois)

### 1. Ajouter PostgreSQL à ton projet Railway

1. Ouvre ton projet sur [railway.app](https://railway.app)
2. Clique **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway crée automatiquement une base PostgreSQL et injecte
   la variable `DATABASE_URL` dans ton service Node.js

### 2. Vérifier que DATABASE_URL est bien liée

1. Clique sur ton service **Node.js** (nanaraff-backend)
2. Onglet **"Variables"**
3. Tu dois voir `DATABASE_URL` avec une valeur du type :
   `postgresql://postgres:xxxxx@containers-us-west-xxx.railway.app:5432/railway`

   Si elle n'est pas là :
   - Clique **"+ Add Variable Reference"**
   - Sélectionne **DATABASE_URL** depuis le service PostgreSQL

### 3. Redéployer

Fais un simple push GitHub ou clique **"Deploy"** dans Railway.
Le serveur détecte `DATABASE_URL` et utilise PostgreSQL automatiquement.

### 4. Vérifier

Ouvre `https://ton-domaine.railway.app/api/health`
Tu dois voir : `{ "ok": true, "db": "postgresql" }`

---

## En développement local

Rien ne change. Sans `DATABASE_URL`, le code utilise automatiquement
SQLite dans `./data/nanaraff.sqlite`.

---

## Que se passe-t-il maintenant à chaque push ?

| Avant (SQLite)                      | Maintenant (PostgreSQL)              |
|-------------------------------------|--------------------------------------|
| Conteneur recréé → fichier .db perdu | Conteneur recréé → PostgreSQL intact |
| Produits perdus ❌                   | Produits conservés ✅                |
| Commandes perdues ❌                 | Commandes conservées ✅              |
| Utilisateurs perdus ❌               | Utilisateurs conservés ✅            |

---

## Sauvegarder tes données PostgreSQL (optionnel)

Depuis le dashboard Railway, onglet **PostgreSQL** → **"Backups"**
tu peux télécharger une sauvegarde de ta base à tout moment.

