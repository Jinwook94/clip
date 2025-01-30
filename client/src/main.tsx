import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import App from "./App";
import "./index.css";

import { useClipStore } from "./store/clipStore";

// ClipStore 에서 clips 가 바뀌면 메인 프로세스에 sync
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
