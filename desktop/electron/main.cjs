const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

function resolveFrontendUrl() {
  if (process.env.VCC_DESKTOP_DEV_URL) return process.env.VCC_DESKTOP_DEV_URL;
  const distIndex = path.resolve(__dirname, '../../frontend/dist/index.html');
  if (!fs.existsSync(distIndex)) {
    throw new Error('frontend/dist/index.html not found. Run `cd frontend && npm run build` first, or set VCC_DESKTOP_DEV_URL.');
  }
  return `file://${distIndex}`;
}

function isAllowedExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_error) {
    return false;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    title: 'vLLM Control Center',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(resolveFrontendUrl());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

module.exports = { isAllowedExternalUrl, resolveFrontendUrl };
