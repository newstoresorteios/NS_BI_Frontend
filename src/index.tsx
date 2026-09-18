import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AppearanceProvider } from "./theme/AppearanceProvider";
import "./style.css";
import "./app/app.css";
import "./theme/appearance.css";
import "./crm/crm.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("Elemento raiz da aplicação não encontrado");

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppearanceProvider>
    </QueryClientProvider>
  </StrictMode>
);
