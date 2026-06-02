# ⚽ Kiricocho - App Campo da Calcetto

## Struttura del progetto

```
football-pitch/
├── backend/      # Node.js + Express + MongoDB
└── mobile/       # React Native + Expo (iOS + Android)
```

---

## 🚀 Avvio rapido

### 1. Backend

```bash
cd backend
npm install

# Copia e configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con la tua connection string MongoDB

npm run dev
```

### 2. App mobile

```bash
cd mobile
npm install
npm start   # apre Expo DevTools
```

Scarica **Expo Go** sul tuo telefono e scansiona il QR code.

**Importante:** Aggiorna `BASE_URL` in `services/api.ts` con il tuo IP locale:
```ts
const BASE_URL = 'http://TUO-IP-LOCALE:5000/api';
```

---

## 📱 Funzionalità

| Schermata | Utente | Admin |
|-----------|--------|-------|
| Registrazione (nome, cognome, email, telefono) | ✅ | ✅ |
| Login | ✅ | ✅ |
| Bacheca (post, foto, notizie, commenti, like) | ✅ | ✅ |
| Prenotazione campo con fasce orarie | ✅ | ✅ |
| Area personale + storico partite | ✅ | ✅ |
| Sistema livelli (ogni 50 partite) | ✅ | ✅ |
| Blocco/sblocco fasce orarie | ❌ | ✅ |
| Gestione utenti (promuovi/disattiva) | ❌ | ✅ |
| Segna partita come completata | ❌ | ✅ |
| Statistiche campo | ❌ | ✅ |

## 🏆 Sistema Livelli

| Livello | Nome | Partite richieste |
|---------|------|-------------------|
| 1 | 🌱 Pivetto | 0 |
| 2 | ⭐ Amatore | 50 |
| 3 | 🌟 Semiprofessionista | 100 |
| 4 | 🏅 Professionista | 200 |
| 5 | 🏆 Campione | 400 |

---

## 🗄️ Database (MongoDB)

### Opzione gratuita: MongoDB Atlas
1. Vai su [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crea account gratuito
3. Crea cluster (M0 Free - gratuito per sempre)
4. Ottieni la connection string e mettila nel `.env`

---

## 📦 Pubblicazione App Store / Play Store

### Prerequisiti
```bash
npm install -g eas-cli
eas login
```

### Build produzione Android (APK/AAB)
```bash
cd mobile
eas build --platform android --profile production
```

### Build produzione iOS
```bash
eas build --platform ios --profile production
# Richiede Apple Developer Account
```

### Submit automatico agli store
```bash
eas submit --platform android
eas submit --platform ios
```

---

## 💰 COSTI

### Sviluppo e hosting

| Servizio | Piano | Costo |
|----------|-------|-------|
| MongoDB Atlas | M0 Free (512MB) | **Gratuito** |
| MongoDB Atlas | M10 (2GB RAM) per produzione | ~$57/mese |
| Backend hosting (Railway) | Starter | **Gratuito** (500h/mese) |
| Backend hosting (Railway) | Pro | $5/mese |
| Backend hosting (Render) | Free | **Gratuito** (con sleep) |
| Backend hosting (Render) | Starter | $7/mese |
| Backend hosting (VPS DigitalOcean) | Basic | $6/mese |
| Expo EAS Build | Free tier | **Gratuito** (30 build/mese) |
| Expo EAS Build | Production | $29/mese illimitato |
| Storage immagini (Cloudinary) | Free | **Gratuito** (25GB) |

### Account sviluppatore per pubblicazione

| Store | Costo | Note |
|-------|-------|------|
| **Google Play Store** | **$25 una tantum** | Pagamento unico, per sempre |
| **Apple App Store** | **$99/anno** | Rinnovabile ogni anno |

### Riepilogo costi minimi per partire

```
Setup iniziale:
├── Google Play Account:  $25   (una volta sola)
├── Apple Developer:      $99   (all'anno)
└── TOTALE SETUP:         $124

Costi mensili (scenario minimo):
├── MongoDB Atlas M0:     $0    (gratuito)
├── Backend (Railway/Render Free): $0
├── Expo EAS Free:        $0
└── TOTALE MESE:          $0 (gratis!)

Costi mensili (scenario produzione stabile):
├── MongoDB Atlas M2:     $9/mese
├── Backend VPS:          $6/mese
├── Expo EAS Production:  $29/mese (opzionale)
└── TOTALE MESE:          ~$15-44/mese
```

---

## 🔧 Primo amministratore

Dopo la registrazione, imposta manualmente il primo admin su MongoDB Atlas:
```javascript
// MongoDB Compass o Atlas Data Explorer
db.users.updateOne(
  { email: "tua-email@email.com" },
  { $set: { role: "admin" } }
)
```

---

## 📋 API Endpoints principali

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/bookings/availability?date=YYYY-MM-DD
POST   /api/bookings
GET    /api/bookings/my
DELETE /api/bookings/:id
POST   /api/bookings/:id/complete

GET    /api/posts
POST   /api/posts
POST   /api/posts/:id/like
POST   /api/posts/:id/comment
DELETE /api/posts/:id

GET    /api/admin/stats
GET    /api/admin/slots
POST   /api/admin/slots/block
DELETE /api/admin/slots/block/:id
GET    /api/admin/bookings
GET    /api/admin/users
PATCH  /api/admin/users/:id/role
```
