// @ts-check
const { spawnSync } = require('node:child_process');
const { copyFileSync, openSync, readSync, closeSync } = require('node:fs');
const path = require('node:path');
const config = require('./package.json');

/** @returns {void} */
function buildWindows() {
  const result = spawnSync(process.execPath, [require.resolve('electron-builder/cli.js'), '--win', 'portable', '--x64', '--publish', 'never'], {
    cwd: __dirname, stdio: 'inherit', env: { ...process.env, ELECTRON_BUILDER_COMPRESSION_LEVEL: '3' }
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Windows derlemesi başarısız. Çıkış kodu: ${result.status}. Sinyal: ${result.signal}. Yukarıdaki paketleyici hatasını kontrol et.`);
  const name = config.build.productName + '.exe';
  const source = path.join(__dirname, 'paket', name);
  const file = openSync(source, 'r');
  const header = Buffer.alloc(2);
  try { readSync(file, header, 0, 2, 0); } finally { closeSync(file); }
  if (header.toString('ascii') !== 'MZ') throw new Error(`Geçerli bir Windows EXE başlığı bulunamadı: ${source}`);
  const destination = path.resolve(__dirname, '..', name);
  copyFileSync(source, destination);
  process.stdout.write(`EXE hazır: ${destination}\n`);
}

buildWindows();
