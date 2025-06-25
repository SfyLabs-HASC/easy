// FILE: src/main.tsx
// Configurazione finale e corretta per thirdweb V5 e il router.

import React from "react";
import { createRoot } from "react-dom/client";
import { ThirdwebProvider } from "thirdweb/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./App.css";

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ThirdwebProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThirdwebProvider>
  </React.StrictMode>
);
