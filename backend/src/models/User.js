const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const LEVELS = [
  { name: 'Pivello', minGames: 0 },
  { name: 'Amatore', minGames: 50 },
  { name: 'Semiprofessionista', minGames: 100 },
  { name: 'Professionista', minGames: 200 },
  { name: 'Campione', minGames: 400 },
];

const userSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    cognome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    gamesPlayed: { type: Number, default: 0 },
    avatar: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.virtual('level').get(function () {
  const games = this.gamesPlayed;
  let currentLevel = LEVELS[0];
  for (const l of LEVELS) {
    if (games >= l.minGames) currentLevel = l;
  }
  const idx = LEVELS.indexOf(currentLevel);
  const next = LEVELS[idx + 1] || null;
  return {
    name: currentLevel.name,
    number: idx + 1,
    gamesPlayed: games,
    gamesForNext: next ? next.minGames : null,
    progress: next ? Math.min(100, Math.floor(((games - currentLevel.minGames) / (next.minGames - currentLevel.minGames)) * 100)) : 100,
  };
});

userSchema.set('toJSON', { virtuals: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function () {
  const obj = this.toJSON();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.LEVELS = LEVELS;
