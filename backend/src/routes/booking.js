import express from "express";
import Booking from "../models/Booking.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// CREAZIONE PRENOTAZIONE (1 ora fissa)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { data, ora } = req.body;

    // Controllo se già prenotato
    const esiste = await Booking.findOne({ data, ora });
    if (esiste) {
      return res.status(400).json({ message: "Orario già prenotato" });
    }

    const nuova = new Booking({
      data,
      ora,
      user: req.userId
    });

    await nuova.save();

    res.json({ message: "Prenotazione effettuata" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore server" });
  }
});


// PRENOTAZIONI DI UN GIORNO
router.get("/disponibili/:data", async (req, res) => {
  try {
    const data = req.params.data;

    // Orari disponibili (puoi modificarli)
    const orari = [
      "09:00", "10:00", "11:00", "12:00",
      "13:00", "14:00", "15:00", "16:00",
      "17:00", "18:00", "19:00", "20:00",
      "21:00", "22:00"
    ];

    const prenotazioni = await Booking.find({ data });

    const occupati = prenotazioni.map(p => p.ora);

    const disponibili = orari.filter(o => !occupati.includes(o));

    res.json({ data, disponibili });
  } catch (error) {
    res.status(500).json({ message: "Errore server", error });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) return res.status(404).json({ error: "Prenotazione non trovata" });
    if (booking.userId.toString() !== req.user.id)
      return res.status(403).json({ error: "Non autorizzato" });

    await booking.deleteOne();

    res.json({ message: "Prenotazione annullata" });
  } catch (err) {
    res.status(500).json({ error: "Errore server" });
  }
});


router.get("/admin/all", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const prenotazioni = await Booking.find()
      .populate("user", "nome cognome email telefono");

    res.json(prenotazioni);
  } catch (error) {
    res.status(500).json({ message: "Errore server", error });
  }
});

// routes/booking.js

router.get("/disponibili/:data", async (req, res) => {
  try {
    const data = req.params.data;

    // Orari disponibili fissi (puoi modificarli)
    const orari = [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00"
    ];

    // Trova prenotazioni già fatte per quella data
    const prenotate = await Booking.find({ data }).select("ora");

    const occupate = prenotate.map(p => p.ora);

    // Filtra gli orari liberi
    const disponibili = orari.filter(ora => !occupate.includes(ora));

    res.json({ disponibili });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Errore server" });
  }
});
router.get("/mie", authMiddleware, async (req, res) => {
  try {
    const prenotazioni = await Booking.find({ userId: req.user.id })
      .sort({ data: 1, ora: 1 });

    res.json(prenotazioni); // <-- DEVE essere un array
  } catch (err) {
    res.status(500).json([]);
  }
});



export default router;
