import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import Navbar from "../components/Navbar";

export default function AdminPanel() {
  const [prenotazioni, setPrenotazioni] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("/api/booking/admin/all", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPrenotazioni(data));
  }, []);

  const cancella = async (id) => {
    await fetch(`/api/booking/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setPrenotazioni(prenotazioni.filter((p) => p._id !== id));
  };

  return (
    <ProtectedRoute adminOnly={true}>
      <Navbar />

      <div style={{ padding: "30px" }}>
        <h1>Pannello Admin</h1>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ora</th>
                <th>Utente</th>
                <th>Telefono</th>
                <th>Azione</th>
              </tr>
            </thead>

            <tbody>
              {prenotazioni.map((p) => (
                <tr key={p._id}>
                  <td>{p.data}</td>
                  <td>{p.ora}</td>
                  <td>{p.user?.nome} {p.user?.cognome}</td>
                  <td>{p.user?.telefono}</td>
                  <td>
                    <button
                      className="button"
                      style={{ backgroundColor: "red" }}
                      onClick={() => cancella(p._id)}
                    >
                      Cancella
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
