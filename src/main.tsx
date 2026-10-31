import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import BetaPortal from "./beta/BetaPortal";

// Hirundu Play is invitation-only. The game bundle is imported only after
// a valid backend session. This is a client-side gate: for strict content
// secrecy, protect the hosting origin at edge/server level too.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><BetaPortal /></React.StrictMode>
);
