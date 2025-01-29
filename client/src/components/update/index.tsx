import React, { useCallback, useEffect, useState } from "react";
import type { IpcRendererEvent } from "electron";
import type { ProgressInfo } from "electron-updater";

import "./update.css";
import Progress from "@/components/update/Progress/index.js";
import Modal from "./Modal/index.js";
import { ErrorType, VersionInfo } from "@/type/electron-updater";

const Update = () => {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | undefined>();
  const [updateError, setUpdateError] = useState<ErrorType | undefined>();
  const [progressInfo, setProgressInfo] = useState<
    Partial<ProgressInfo> | undefined
  >();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalBtn, setModalBtn] = useState<{
    cancelText?: string;
    okText?: string;
    onCancel?: () => void;
    onOk?: () => void;
  }>({
    onCancel: () => setModalOpen(false),
    onOk: () => window.ipcRenderer.invoke("start-download"),
  });

  const checkUpdate = async () => {
    setChecking(true);
    const result = await window.ipcRenderer.invoke("check-update");
    setProgressInfo({ percent: 0 });
    setChecking(false);
    setModalOpen(true);

    if (result?.error) {
      setUpdateAvailable(false);
      setUpdateError(result?.error);
    }
  };

  const onUpdateCanAvailable = useCallback(
    (_unusedEvent: IpcRendererEvent, arg1: VersionInfo) => {
      setVersionInfo(arg1);
      setUpdateError(undefined);
      if (arg1.update) {
        setModalBtn((state) => ({
          ...state,
          cancelText: "Cancel",
          okText: "Update",
          onOk: () => window.ipcRenderer.invoke("start-download"),
        }));
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
      }
    },
    [],
  );

  const onUpdateError = useCallback(
    (_unusedEvent: IpcRendererEvent, arg1: ErrorType) => {
      setUpdateAvailable(false);
      setUpdateError(arg1);
    },
    [],
  );

  const onDownloadProgress = useCallback(
    (_unusedEvent: IpcRendererEvent, arg1: ProgressInfo) => {
      setProgressInfo(arg1);
    },
    [],
  );

  const onUpdateDownloaded = useCallback(() => {
    setProgressInfo({ percent: 100 });
    setModalBtn((state) => ({
      ...state,
      cancelText: "Later",
      okText: "Install now",
      onOk: () => window.ipcRenderer.invoke("quit-and-install"),
    }));
  }, []);

  useEffect(() => {
    window.ipcRenderer.on("update-can-available", onUpdateCanAvailable);
    window.ipcRenderer.on("update-error", onUpdateError);
    window.ipcRenderer.on("download-progress", onDownloadProgress);
    window.ipcRenderer.on("update-downloaded", onUpdateDownloaded);

    return () => {
      window.ipcRenderer.off("update-can-available", onUpdateCanAvailable);
      window.ipcRenderer.off("update-error", onUpdateError);
      window.ipcRenderer.off("download-progress", onDownloadProgress);
      window.ipcRenderer.off("update-downloaded", onUpdateDownloaded);
    };
  }, [
    onUpdateCanAvailable,
    onUpdateError,
    onDownloadProgress,
    onUpdateDownloaded,
  ]);

  return (
    <>
      <Modal
        open={modalOpen}
        cancelText={modalBtn.cancelText}
        okText={modalBtn.okText}
        onCancel={modalBtn.onCancel}
        onOk={modalBtn.onOk}
        footer={updateAvailable ? null : undefined}
      >
        <div className="modal-slot">
          {updateError ? (
            <div>
              <p>Error downloading the latest version.</p>
              <p>{updateError.message}</p>
            </div>
          ) : updateAvailable ? (
            <div>
              <div>The last version is: v{versionInfo?.newVersion}</div>
              <div className="new-version__target">
                v{versionInfo?.version} -&gt; v{versionInfo?.newVersion}
              </div>
              <div className="update__progress">
                <div className="progress__title">Update progress:</div>
                <div className="progress__bar">
                  <Progress percent={progressInfo?.percent} />
                </div>
              </div>
            </div>
          ) : (
            <div className="can-not-available">
              {JSON.stringify(versionInfo ?? {}, null, 2)}
            </div>
          )}
        </div>
      </Modal>

      <button disabled={checking} onClick={checkUpdate}>
        {checking ? "Checking..." : "Check update"}
      </button>
    </>
  );
};

export default Update;
