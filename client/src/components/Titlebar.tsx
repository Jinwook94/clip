import React from "react";

function Titlebar() {
  const handleClose = () => {
    window.ipcRenderer.send("window-close");
  };
  const handleMinimize = () => {
    window.ipcRenderer.send("window-minimize");
  };
  const handleMaximize = () => {
    window.ipcRenderer.send("window-toggle-maximize");
  };

  return (
    <div className="titlebar flex h-8 items-center no-drag-region">
      <button className="close-btn mr-2" onClick={handleClose}>
        ✕
      </button>
      <button className="min-btn mr-2" onClick={handleMinimize}>
        ▭
      </button>
      <button className="max-btn" onClick={handleMaximize}>
        ◻
      </button>
    </div>
  );
}

export default Titlebar;
