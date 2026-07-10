const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('vccDesktop', {
  platform: process.platform,
  mode: process.env.VCC_DESKTOP_DEV_URL ? 'dev-url' : 'built-frontend',
});
