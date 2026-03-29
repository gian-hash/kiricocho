export default function Navbar() {
  return (
    <nav className="navbar">
      <h1>Football Pitch</h1>
      <div>
        <a href="/prenotazioni">Prenotazioni</a>
        <a href="/campo">Campo</a>
        <a href="/admin">Admin</a>
        <a href="/login">Logout</a>
      </div>
    </nav>
  );
}
