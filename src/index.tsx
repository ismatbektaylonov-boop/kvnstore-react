import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./css/index.css";

// Build-time selection keeps the other interface out of this application's bundle.
const App =
  process.env.REACT_APP_INTERFACE === "admin"
    ? require("./admin/App").default
    : require("./app/App").default;

const container = document.getElementById("root");
if (!container) throw new Error("Root element was not found");
createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
