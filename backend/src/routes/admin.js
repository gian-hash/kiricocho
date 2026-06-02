const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const BlockedSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { DEFAULT_SLOTS } = require('../models/TimeSlot');

// Tutte le route admin richiedono autenticazione + ruolo admin
router.use(auth, adminOnly);

// GET /api/admin/slots — lista slot bloccati
router.get('/slots', async (req, res) => {
  const blocked = await BlockedSlot.find().populate('blockedBy', 'nome cognome');
  res.json({ blocked, defaultSlots: DEFAULT_SLOTS });
});

// POST /api/admin/slots/block — blocca una fascia oraria
router.post('/slots/block', async (req, res) => {
  const { slot, date, reason } = req.body;
  if (!slot) return res.status(400).json({ message: 'Slot obbligatorio.' });
  if (!DEFAULT_SLOTS.includes(slot)) return res.status(400).json({ message: 'Slot non valido.' });

  const existing = await BlockedSlot.findOne({ slot, date: date || null });
  if (existing) return res.status(400).json({ message: 'Slot già bloccato.' });

  const blocked = await BlockedSlot.create({ slot, date: date || null, reason, blockedBy: req.user._id });
  res.status(201).json({ blocked });
});

// DELETE /api/admin/slots/block/:id — sblocca fascia oraria
router.delete('/slots/block/:id', async (req, res) => {
  await BlockedSlot.findByIdAndDelete(req.params.id);
  res.json({ message: 'Fascia oraria sbloccata.' });
});

// GET /api/admin/bookings — tutte le prenotazioni
router.get('/bookings', async (req, res) => {
  const { date } = req.query;
  const filter = {};
  if (date) filter.date = date;
  const bookings = await Booking.find(filter)
    .sort({ date: -1, timeSlot: 1 })
    .populate('user', 'nome cognome email telefono');
  res.json({ bookings });
});

// GET /api/admin/users — lista utenti
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

// PATCH /api/admin/users/:id/role — promuovi/degrada utente
router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Ruolo non valido.' });
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
  res.json({ user });
});

// PATCH /api/admin/users/:id/toggle — attiva/disattiva account
router.patch('/users/:id/toggle', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Utente non trovato.' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ isActive: user.isActive });
});

// POST /api/admin/bookings — prenota per conto di un utente
router.post('/bookings', async (req, res) => {
  const { userId, date, timeSlot, teamName, notes } = req.body;
  if (!userId || !date || !timeSlot) return res.status(400).json({ message: 'userId, data e fascia oraria obbligatori.' });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: 'Utente non trovato.' });

  const blocked = await BlockedSlot.findOne({ slot: timeSlot, $or: [{ date }, { date: null }] });
  if (blocked) return res.status(400).json({ message: 'Fascia oraria non disponibile.' });

  const existing = await Booking.findOne({ date, timeSlot, status: 'confirmed' });
  if (existing) return res.status(400).json({ message: 'Fascia oraria già prenotata.' });

  const booking = await Booking.create({ user: userId, date, timeSlot, teamName, notes });
  await booking.populate('user', 'nome cognome email telefono');
  res.status(201).json({ booking });
});

// DELETE /api/admin/bookings/:id — cancella prenotazione di qualsiasi utente
router.delete('/bookings/:id', async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Prenotazione non trovata.' });
  booking.status = 'cancelled';
  await booking.save();
  res.json({ message: 'Prenotazione cancellata dall\'admin.' });
});

// GET /api/admin/stats — statistiche generali
router.get('/stats', async (req, res) => {
  const [totalUsers, totalBookings, upcomingBookings] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({
      status: 'confirmed',
      date: { $gte: new Date().toISOString().slice(0, 10) },
    }),
  ]);
  res.json({ totalUsers, totalBookings, upcomingBookings });
});

module.exports = router;
