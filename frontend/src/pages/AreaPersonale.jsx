import { useEffect, useState } from "react";

export default function AreaPersonale() {
  const [prenotazioni, setPrenotazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    caricaPrenotazioni();
  }, []);

  const caricaPrenotazioni = async () => {
    setLoading(true);
    const res = await fetch("/api/booking/mie", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const json = await res.json();
    console.log("RISPOSTA BACKEND:", json);
    setPrenotazioni(Array.isArray(json) ? json : []);
    setLoading(false);
  };

  const annulla = async (id) => {
    const res = await fetch(`/api/booking/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const json = await res.json();
    console.log("RISPOSTA BACKEND2:", json);
    setToast(json.message);
    caricaPrenotazioni();
  };

  return (
    <div className="page-wrapper">

      {toast && <div className="toast">{toast}</div>}

      <div className="card" style={{ maxWidth: "600px" }}>
        <h1 className="title">Area Personale</h1>

        <h2 className="subtitle">Le mie prenotazioni</h2>

        {loading && <div className="loader"></div>}

        <div className="prenotazioni-list">
          {prenotazioni.map((p) => {
            const isPassata = new Date(p.data) < new Date();

            return (
              <div key={p._id} className="prenotazione-card">
                <div className="info">
                  <div className="data">{p.data}</div>
                  <div className="ora">{p.ora}</div>
                </div>

                {!isPassata && (
                  <button className="btn-secondary" onClick={() => annulla(p._id)}>
                    Annulla
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
