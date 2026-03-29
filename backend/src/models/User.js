import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String, required: true },
  password: { type: String, required: true },
  livello: { type: Number, default: 1 }, // per sconti, premi, ecc.
  ruolo: { type: String, default: "user" } // "user" o "admin"
});

export default mongoose.model("User", userSchema);
