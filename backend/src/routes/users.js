const router = require('express').Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');

// GET /api/users/profile — profilo dell'utente loggato
router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ user: user.toSafeJSON() });
});

// PATCH /api/users/profile — aggiorna dati profilo
router.patch('/profile', auth, upload.single('avatar'), async (req, res) => {
  const { nome, cognome, telefono } = req.body;
  const updates = {};
  if (nome) updates.nome = nome;
  if (cognome) updates.cognome = cognome;
  if (telefono) updates.telefono = telefono;
  if (req.file) updates.avatar = `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
  res.json({ user: user.toSafeJSON() });
});

// PATCH /api/users/password — cambia password
router.patch('/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Entrambe le password sono obbligatorie.' });
  }
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password minimo 6 caratteri.' });

  const user = await User.findById(req.user._id);
  const valid = await user.comparePassword(currentPassword);
  if (!valid) return res.status(401).json({ message: 'Password attuale non corretta.' });

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password aggiornata.' });
});

module.exports = router;
