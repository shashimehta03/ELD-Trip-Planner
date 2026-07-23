import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Trips from "./pages/Trips";
import Plan from "./pages/Plan";
import RouteAnalysis from "./pages/RouteAnalysis";
import Hos from "./pages/Hos";
import Logs from "./pages/Logs";

export default function App() {
  return (
    <>
      <Navbar />
      <div className="shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/route" element={<RouteAnalysis />} />
          <Route path="/hos" element={<Hos />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </div>
    </>
  );
}
