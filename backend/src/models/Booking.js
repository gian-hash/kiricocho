const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },   // formato "YYYY-MM-DD"
    timeSlot: { type: String, required: true }, // es. "20:00-21:30"
    teamName: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending'],
      default: 'confirmed',
    },
    gameCompleted: { type: Boolean, default: false }, // true quando la partita è finita
  },
  { timestamps: true }
);

// Unicità: stessa data + stessa fascia oraria non può essere prenotata due volte
bookingSchema.index({ date: 1, timeSlot: 1 }, { unique: true, partialFilterExpression: { status: 'confirmed' } });

module.exports = mongoose.model('Booking', bookingSchema);
