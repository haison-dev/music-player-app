const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('musicPlatform', {
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
  },
  library: {
    selectFolder: () => ipcRenderer.invoke('library:select-folder'),
  },
});
