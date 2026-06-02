const mongoose = require('mongoose');

// Fasce orarie di default del campo
const DEFAULT_SLOTS = [
  '08:00-09:30',
  '09:30-11:00',
  '11:00-12:30',
  '12:30-14:00',
  '14:00-15:30',
  '15:30-17:00',
  '17:00-18:30',
  '18:30-20:00',
  '20:00-21:30',
  '21:30-23:00',
];

// Fasce bloccate dall'admin per date specifiche o permanentemente
const blockedSlotSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true }, // es. "20:00-21:30"
    date: { type: String, default: null },  // "YYYY-MM-DD" oppure null = bloccato sempre
    reason: { type: String, default: '' },
    blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlockedSlot', blockedSlotSchema);
module.exports.DEFAULT_SLOTS = DEFAULT_SLOTS;
