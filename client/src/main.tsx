import React from "react";
import ReactDOM from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nextProvider } from "react-i18next";

import i18n from "./i18n";
import App from "./App";
import "./index.css";

import { useBlockStore } from "@/store/blockStore";

// blockStore에서 blocks가 변경될 때마다 IPC로 "blocks-sync" 이벤트 보냄
useBlockStore.subscribe((state) => {
  const blocks = state.blocks;
  window.ipcRenderer.send("blocks-sync", blocks);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={200} disableHoverableContent={true}>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </TooltipProvider>
  </React.StrictMode>,
);
