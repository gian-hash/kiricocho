import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  data: { type: String, required: true }, // "2026-03-28"
  ora: { type: String, required: true },  // "18:00"
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Booking", bookingSchema);
