import { useState, useEffect } from "react";

const TUTTI_GLI_ORARI = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00",
  "21:00", "22:00"
];

export default function Campo() {
  const [data, setData] = useState("");
  const [orari, setOrari] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");
  const [loadingPrenota, setLoadingPrenota] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const oggi = new Date().toISOString().split("T")[0];
    setData(oggi);
  }, []);

  useEffect(() => {
    if (data) {
      caricaOrari();
    }
  }, [data]);

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // FILTRO ORARI FUTURI SE LA DATA È OGGI
  function filtraOrari(orariDisponibili, dataSelezionata) {
    const oggi = new Date().toISOString().split("T")[0];

    if (dataSelezionata !== oggi) return orariDisponibili;

    const oraAttuale = new Date().getHours();

    return orariDisponibili.filter((ora) => {
      const oraSlot = parseInt(ora.split(":")[0]);
      return oraSlot > oraAttuale;
    });
  }

  // Carica orari disponibili
  const caricaOrari = async () => {
    if (!data) return;

    setLoading(true);

    const res = await fetch(`/api/booking/disponibili/${data}`);
    const json = await res.json();

    const filtrati = filtraOrari(json.disponibili || [], data);
    setOrari(filtrati);

    setLoading(false);
  };

  // Prenotazione
  const prenota = async (ora) => {
  try {
    const res = await fetch("/api/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data, ora }),
    });

    const json = await res.json();

    if (json.message === "Prenotazione effettuata") {
      setToast("Prenotazione confermata!");
      setSelected(null); // chiude pannello
      await caricaOrari(); // aggiorna gli orari
    } else {
      setToast(json.message || "Errore nella prenotazione");
    }
  } catch (err) {
    setToast("Errore di connessione");
  }
};


  const prenotati = TUTTI_GLI_ORARI.filter(o => !orari.includes(o));

  function isOrarioPassato(ora, dataSelezionata) {
  const oggi = new Date().toISOString().split("T")[0];
  if (dataSelezionata !== oggi) return false;

  const oraAttuale = new Date().getHours();
  const oraSlot = parseInt(ora.split(":")[0]);

    return oraSlot <= oraAttuale;
  }

  return (
    <div className="page-wrapper">

      {/* TOAST */}
      {toast && <div className="toast">{toast}</div>}

      {/* PANNELLO LATERALE */}
      {selected && (
        <div className="confirm-panel">
          <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>
            Conferma prenotazione
          </h3>

          <p style={{ fontSize: "16px", marginBottom: "20px" }}>
            {data} alle <strong>{selected}</strong>
          </p>

          <button
            className="btn"
            disabled={loadingPrenota}
            onClick={async () => {
              setLoadingPrenota(true);
              await prenota(selected);
              setLoadingPrenota(false);
            }}
          >
          {loadingPrenota ? "Attendere..." : "Conferma"}
        </button>


          <button
            className="btn-secondary"
            onClick={() => setSelected(null)}
            style={{ marginTop: "10px" }}
          >
            Annulla
          </button>
        </div>
      )}

      {/* CARD CENTRALE */}
      <div className="card">

        <h1 className="title">
          <span style={{opacity:0.8, marginRight:"8px"}}>🏟️</span>
          Prenota il Campo
        </h1>

        {/* SEZIONE DATA */}
        <div className="date-row">
          <div className="date-box">
            <label>Seleziona una data</label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <button className="btn" onClick={caricaOrari}>
            Mostra orari
          </button>
        </div>

        <h2 className="subtitle">Orari disponibili</h2>

        {loading && <div className="loader"></div>}

        {/* ORARI */}
        <div className="grid">
          {TUTTI_GLI_ORARI.map((ora) => {
            const isDisponibile = orari.includes(ora);

            return (
              <div key={ora} className="slot-wrapper">
                <button
                  disabled={!isDisponibile || isOrarioPassato(ora, data)}
                  className={`slot ${
                    !isDisponibile || isOrarioPassato(ora, data) ? "disabled" : ""
                  }`}
                  onClick={() => setSelected(ora)}
                >
                  {ora}
                </button>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
