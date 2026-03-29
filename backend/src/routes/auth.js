import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// REGISTRAZIONE UTENTE
router.post("/register", async (req, res) => {
  try {
    const { nome, cognome, email, telefono, password } = req.body;

    // Controllo campi obbligatori
    if (!nome || !cognome || !email || !telefono || !password) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    // Controllo se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email già registrata" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creazione utente
    const newUser = new User({
      nome,
      cognome,
      email,
      telefono,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "Registrazione completata" });
  } catch (error) {
    res.status(500).json({ message: "Errore server", error });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Controllo campi
    if (!email || !password) {
      return res.status(400).json({ message: "Email e password sono obbligatori" });
    }

    // Controllo utente
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Credenziali non valide" });
    }

    // Controllo password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenziali non valide" });
    }

    // Generazione token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login effettuato",
      token,
      user: {
        id: user._id,
        nome: user.nome,
        cognome: user.cognome,
        email: user.email,
        telefono: user.telefono,
        livello: user.livello
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Errore server", error });
  }
});


export default router;
