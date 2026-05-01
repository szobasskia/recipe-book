import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";

const redirectPath = new URLSearchParams(window.location.search).get("p");
if (redirectPath) {
  const normalized = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  window.history.replaceState({}, "", `${import.meta.env.BASE_URL}${normalized}`.replace(/\/{2,}/g, "/"));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}
