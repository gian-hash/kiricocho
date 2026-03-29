import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Campo from "./pages/Campo";
import AdminPanel from "./pages/AdminPanel";
import AreaPersonale from "./pages/AreaPersonale";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/campo" element={<Campo />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/area-personale" element={<AreaPersonale />} />
      </Routes>
    </BrowserRouter>
  );
}
