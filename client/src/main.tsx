import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import App from "./App";
import "./index.css";

// zustand store 구독 → clips 가 바뀔 때마다 IPC 로 동기화
import { useClipStore } from "./store/clipStore";

useClipStore.subscribe((state) => {
  const clips = state.clips;
  window.ipcRenderer.send("clips-sync", clips);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>,
);
