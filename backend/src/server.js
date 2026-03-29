import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bookingRoutes from "./routes/booking.js";

// Import delle route
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route principali
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/booking", bookingRoutes);
// Route di test
app.get("/test", (req, res) => {
    res.json({ message: "Il server funziona!" });
});

// Connessione a MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connesso");
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => console.log(`Server attivo su porta ${PORT}`));
    })
    .catch((err) => {
        console.error("Errore connessione MongoDB", err);
    });
