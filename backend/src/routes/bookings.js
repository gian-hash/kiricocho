const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const BlockedSlot = require('../models/TimeSlot');
const { DEFAULT_SLOTS } = require('../models/TimeSlot');

// GET /api/bookings/availability?date=YYYY-MM-DD
router.get('/availability', auth, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Data obbligatoria' });

  const [booked, blocked] = await Promise.all([
    Booking.find({ date, status: 'confirmed' }).select('timeSlot user'),
    BlockedSlot.find({ $or: [{ date }, { date: null }] }).select('slot reason'),
  ]);

  const blockedSlots = new Set(blocked.map((b) => b.slot));
  const bookedMap = {};
  booked.forEach((b) => { bookedMap[b.timeSlot] = b; });

  const slots = DEFAULT_SLOTS.map((slot) => ({
    slot,
    available: !blockedSlots.has(slot) && !bookedMap[slot],
    bookedBy: null, // nascosto agli utenti
    blocked: blockedSlots.has(slot),
    blockReason: blocked.find((b) => b.slot === slot)?.reason || null,
  }));

  res.json({ date, slots });
});

// POST /api/bookings — crea prenotazione
router.post('/', auth, async (req, res) => {
  const { date, timeSlot, teamName, notes } = req.body;
  if (!date || !timeSlot) return res.status(400).json({ message: 'Data e fascia oraria obbligatorie' });

  // Verifica slot non bloccato
  const blocked = await BlockedSlot.findOne({ slot: timeSlot, $or: [{ date }, { date: null }] });
  if (blocked) return res.status(400).json({ message: 'Fascia oraria non disponibile.' });

  // Verifica non già prenotato
  const existing = await Booking.findOne({ date, timeSlot, status: 'confirmed' });
  if (existing) return res.status(400).json({ message: 'Fascia oraria già prenotata.' });

  const booking = await Booking.create({ user: req.user._id, date, timeSlot, teamName, notes });
  await booking.populate('user', 'nome cognome email telefono');
  res.status(201).json({ booking });
});

// GET /api/bookings/my — prenotazioni dell'utente
router.get('/my', auth, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ date: -1 })
    .lean();
  res.json({ bookings });
});

// DELETE /api/bookings/:id — cancella prenotazione
router.delete('/:id', auth, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Prenotazione non trovata.' });

  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Non autorizzato.' });
  }

  booking.status = 'cancelled';
  await booking.save();
  res.json({ message: 'Prenotazione cancellata.' });
});

// POST /api/bookings/:id/complete — admin/sistema marca partita come completata
router.post('/:id/complete', auth, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Prenotazione non trovata.' });

  if (booking.gameCompleted) return res.status(400).json({ message: 'Partita già segnata come completata.' });

  booking.gameCompleted = true;
  await booking.save();

  // Incrementa gamesPlayed dell'utente
  const User = require('../models/User');
  await User.findByIdAndUpdate(booking.user, { $inc: { gamesPlayed: 1 } });

  res.json({ message: 'Partita completata, livello aggiornato.' });
});

module.exports = router;
