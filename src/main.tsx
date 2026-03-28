import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SolanaProvider } from "@solana/react-hooks";
import { solanaClient } from "./lib/solana";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SolanaProvider client={solanaClient}>
      <App />
    </SolanaProvider>
  </StrictMode>
);
