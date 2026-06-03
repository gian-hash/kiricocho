require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/bookings', require('./src/routes/bookings'));
app.use('/api/posts', require('./src/routes/posts'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/users', require('./src/routes/users'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Kiricocho' }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connesso');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server avviato su porta ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error('Errore connessione MongoDB:', err.message);
    process.exit(1);
  });
