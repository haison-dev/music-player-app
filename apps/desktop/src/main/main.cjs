const { app, BrowserWindow, dialog, ipcMain, protocol, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const localFileProtocol = 'music-local';
const localFileUrlPrefix = `${localFileProtocol}:///`;
const maxUploadBytes = 25 * 1024 * 1024;

protocol.registerSchemesAsPrivileged([
  {
    scheme: localFileProtocol,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);

function toLocalFileUrl(filePath) {
  return `${localFileUrlPrefix}${encodeURIComponent(filePath)}`;
}

function fromLocalFileUrl(url) {
  if (url.startsWith(localFileUrlPrefix)) {
    return decodeURIComponent(url.slice(localFileUrlPrefix.length));
  }

  return decodeURIComponent(new URL(url).host);
}

async function readAudioFile(filePath) {
  try {
    const { parseFile } = await import('music-metadata');
    const metadata = await parseFile(filePath);
    const picture = metadata.common.picture?.[0];
    const title = metadata.common.title?.trim() || null;
    const artistName = metadata.common.artist?.trim() || metadata.common.albumartist?.trim() || null;
    const durationSeconds = metadata.format.duration ? Math.max(1, Math.round(metadata.format.duration)) : null;
    let coverUrl = null;

    if (picture?.data?.length && picture.format) {
      const extension = picture.format.split('/').pop() || 'jpg';
      const coverHash = createHash('sha256').update(filePath).update(picture.data).digest('hex');
      const coversDir = path.join(app.getPath('userData'), 'covers');
      const coverPath = path.join(coversDir, `${coverHash}.${extension}`);

      await fs.mkdir(coversDir, { recursive: true });
      await fs.writeFile(coverPath, picture.data);
      coverUrl = toLocalFileUrl(coverPath);
    }

    return {
      filePath,
      audioUrl: toLocalFileUrl(filePath),
      bytes: null,
      title,
      artistName,
      coverUrl,
      durationSeconds,
    };
  } catch {
    return {
      filePath,
      audioUrl: toLocalFileUrl(filePath),
      bytes: null,
      title: null,
      artistName: null,
      coverUrl: null,
      durationSeconds: null,
    };
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'Music Platform',
    backgroundColor: '#111111',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setMenuBarVisibility(false);

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  protocol.handle(localFileProtocol, (request) => {
    const filePath = fromLocalFileUrl(request.url);
    return fetch(pathToFileURL(filePath).toString());
  });

  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('library:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select a music folder',
    });

    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle('library:select-audio-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      title: 'Select audio files',
      filters: [
        { name: 'Audio', extensions: ['mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg'] },
      ],
    });

    return result.canceled ? [] : Promise.all(result.filePaths.map(readAudioFile));
  });
  ipcMain.handle('library:read-audio-file', async (_event, filePath) => {
    const data = await fs.readFile(filePath);

    if (data.byteLength > maxUploadBytes) {
      throw new Error('Audio file is larger than 25 MB.');
    }

    return new Uint8Array(data).buffer;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
