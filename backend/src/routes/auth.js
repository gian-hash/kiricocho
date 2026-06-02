const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('nome').trim().notEmpty().withMessage('Nome obbligatorio'),
    body('cognome').trim().notEmpty().withMessage('Cognome obbligatorio'),
    body('email').isEmail().withMessage('Email non valida'),
    body('telefono').trim().notEmpty().withMessage('Telefono obbligatorio'),
    body('password').isLength({ min: 6 }).withMessage('Password minimo 6 caratteri'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nome, cognome, email, telefono, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email già registrata.' });

    const user = await User.create({ nome, cognome, email, telefono, password });
    const token = generateToken(user._id);

    res.status(201).json({ token, user: user.toSafeJSON() });
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email non valida'),
    body('password').notEmpty().withMessage('Password obbligatoria'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenziali non valide.' });
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account disabilitato.' });

    const token = generateToken(user._id);
    res.json({ token, user: user.toSafeJSON() });
  }
);

// GET /api/auth/me
router.get('/me', require('../middleware/auth').auth, (req, res) => {
  res.json({ user: req.user.toSafeJSON ? req.user.toSafeJSON() : req.user });
});

module.exports = router;
