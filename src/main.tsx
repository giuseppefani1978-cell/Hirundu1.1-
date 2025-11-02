// src/main.tsx
import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";

// Global styles & map dependencies
import "leaflet/dist/leaflet.css";
import "./leaflet-icons";
import "./ui/styles.css";

import App from "./app"; // <- LOWERCASE to match src/app.tsx
import { store } from "./store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
