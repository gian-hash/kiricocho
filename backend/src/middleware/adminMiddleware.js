export default function adminMiddleware(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Accesso riservato ai proprietari" });
  }
  next();
}
