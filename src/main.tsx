// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";

// styles that your map needs (safe to keep even if RealMap is not visited)
import "leaflet/dist/leaflet.css";
import "./leaflet-icons";

import App from "./app"; // <- LOWERCASE to match src/app.tsx

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
