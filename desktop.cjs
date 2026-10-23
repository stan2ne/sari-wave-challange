// @ts-check
const { app, BrowserWindow, dialog, screen } = require('electron');
const path = require('node:path');
const {mkdirSync}=require('node:fs');
const productName='Sarı Wave Challange';

const savedProfile=app.getPath('userData');
mkdirSync(savedProfile,{recursive:true});
app.setName(productName);
app.setPath('userData',savedProfile);

/** @returns {Promise<void>} */
async function createWindow() {
  const workArea=screen.getPrimaryDisplay().workAreaSize;
  const window = new BrowserWindow({
    title: productName, width: Math.min(1360,workArea.width), height: Math.min(900,workArea.height), minWidth: 1080, minHeight: 740,
    icon:path.join(__dirname,'build','icon.png'),
    useContentSize: true, backgroundColor: '#0c1010', autoHideMenuBar: true, show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  window.setMenu(null);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault();
  });
  window.webContents.on('render-process-gone', (_event, details) => {
    dialog.showErrorBox('Oyun penceresi kapandı', `Neden: ${details.reason}. Çıkış kodu: ${details.exitCode}. Oyunu yeniden aç.`);
    app.quit();
  });
  window.once('ready-to-show', () => window.show());
  await window.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow).catch((error) => {
  dialog.showErrorBox('Oyun başlatılamadı', String(error));
  app.exit(1);
});
app.on('window-all-closed', () => { app.quit(); });
