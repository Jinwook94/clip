import { Tray, Menu, BrowserWindow, app, nativeImage } from "electron";
import path from "node:path";
import { setIsQuitting } from "./index";
import i18nMain from "./i18nMain";

let tray: Tray | null = null;

export function createTray(mainWindow: BrowserWindow) {
  const isDev = !!process.env.VITE_DEV_SERVER_URL;

  let trayIconPath: string;
  if (isDev) {
    trayIconPath = path.join(process.cwd(), "build", "icon.png");
  } else {
    trayIconPath = path.join(process.resourcesPath, "build", "icon.png");
  }

  const nImage = nativeImage.createFromPath(trayIconPath);
  if (nImage.isEmpty()) {
    console.warn("[Tray] Failed to load icon:", trayIconPath);
  } else {
    console.log("[Tray] Loaded tray icon:", trayIconPath);
  }

  const resized = nImage.resize({ width: 16, height: 16 });
  tray = new Tray(resized);

  // 다국어 툴팁
  tray.setToolTip(i18nMain.t("CLIP_APP") || "Clip App");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: i18nMain.t("OPEN_CLIP") || "Open Clip",
      click: () => {
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        } else {
          mainWindow.focus();
        }
      },
    },
    {
      label: i18nMain.t("QUIT") || "Quit",
      click: () => {
        setIsQuitting(true);
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    tray?.popUpContextMenu();
  });
  tray.on("right-click", () => {
    tray?.popUpContextMenu();
  });
}
