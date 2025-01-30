// client/electron/main/tray.ts
import { Tray, Menu, BrowserWindow, app, nativeImage } from "electron";
import path from "node:path";
import { setIsQuitting } from "./index";

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

  // 아이콘 크기 조절 (16x16)
  const resized = nImage.resize({
    width: 16,
    height: 16,
  });

  tray = new Tray(resized);
  tray.setToolTip("Clip App");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Clip",
      click: () => {
        // 창이 없으면 새로 만들 수도 있고,
        // 여기서는 기존 mainWindow가 숨겨져 있는 상태라면 다시 show
        if (!mainWindow.isVisible()) {
          mainWindow.show();
        } else {
          mainWindow.focus();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        // Tray Quit 시에만 실제 종료
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
